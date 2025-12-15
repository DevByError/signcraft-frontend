/**
 * Responsive Firestore Design Service
 * Handles all responsive design operations with Firebase Firestore
 * All stored data uses normalized coordinates (0-1 ratios)
 */

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  doc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  QueryConstraint,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db, auth } from './firebaseService';
import {
  ResponsiveDesignDocument,
  SaveDesignResponse,
  UpdateDesignOptions,
} from '../types-responsive';
import {
  serializeToResponsiveFormat,
  validateResponsiveDesign,
  cleanDesignForFirestore,
  generateDesignExportInfo,
} from './responsiveExportService';

const DESIGNS_COLLECTION = 'designs_responsive';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const DEFAULT_USER_ID = 'local_user';
const DEFAULT_USER_EMAIL = 'local@signcraft.dev';

/**
 * Get current user (with fallback for local development)
 */
const getCurrentUser = () => {
  const authUser = auth?.currentUser;
  return {
    uid: authUser?.uid || DEFAULT_USER_ID,
    email: authUser?.email || DEFAULT_USER_EMAIL,
    isAuthenticated: !!authUser,
  };
};

/**
 * Retry operation with exponential backoff
 */
const retryOperation = async <T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    if (retries > 0 && (error.code === 'unavailable' || error.code === 'deadline-exceeded')) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return retryOperation(operation, retries - 1);
    }
    throw error;
  }
};

/**
 * Convert Firestore snapshot to design document
 */
const mapFirestoreDocToDesign = (docSnap: QueryDocumentSnapshot<DocumentData>): ResponsiveDesignDocument => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
  } as ResponsiveDesignDocument;
};

/**
 * Save responsive design to Firestore
 * @param elements - Array of editor elements (pixel-based)
 * @param metadata - Design metadata
 * @param options - Save options
 * @returns Save response with design ID
 */
export const saveResponsiveDesignToFirestore = async (
  elements: any[],
  metadata: any,
  options: UpdateDesignOptions = {}
): Promise<SaveDesignResponse> => {
  try {
    // Serialize to responsive format (normalizes all coordinates)
    const design = serializeToResponsiveFormat(elements, metadata);

    // Validate responsive structure
    const validation = validateResponsiveDesign(design);
    if (!validation.isValid) {
      console.error('❌ [RESPONSIVE DESIGN] Validation failed:', validation.errors);
      return {
        success: false,
        error: `Responsive design validation failed: ${validation.errors.join(', ')}`,
      };
    }

    // Prepare for Firestore (remove undefined values)
    const cleanedDesign = cleanDesignForFirestore(design);
    const currentUser = getCurrentUser();
    const now = Timestamp.now();

    // Build Firestore document
    const documentData: Omit<ResponsiveDesignDocument, 'id'> = {
      userId: currentUser.uid,
      userEmail: currentUser.email,
      isPublic: Boolean(options.isPublic ?? false),
      metadata: cleanedDesign.metadata,
      elements: cleanedDesign.elements,
      createdAt: now,
      updatedAt: now,
      viewCount: 0,
      likes: 0,
    };

    // Save with retry logic
    const designId = await retryOperation(async () => {
      const docRef = await addDoc(
        collection(db, DESIGNS_COLLECTION),
        documentData
      );
      return docRef.id;
    });

    // Log success with export info
    const exportInfo = generateDesignExportInfo({ ...cleanedDesign, id: designId } as ResponsiveDesignDocument);
    console.log('✅ [RESPONSIVE DESIGN] Saved successfully:', exportInfo);

    return {
      success: true,
      designId,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('❌ [RESPONSIVE DESIGN] Save failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to save responsive design',
    };
  }
};

/**
 * Update responsive design
 * @param designId - Design document ID
 * @param elements - Updated elements (pixel-based)
 * @param metadata - Updated metadata
 * @param options - Update options
 * @returns Save response
 */
export const updateResponsiveDesignInFirestore = async (
  designId: string,
  elements: any[],
  metadata: any,
  options: UpdateDesignOptions = {}
): Promise<SaveDesignResponse> => {
  try {
    // Serialize to responsive format
    const design = serializeToResponsiveFormat(elements, metadata);

    // Validate
    const validation = validateResponsiveDesign(design);
    if (!validation.isValid) {
      console.error('❌ [RESPONSIVE DESIGN] Update validation failed:', validation.errors);
      return {
        success: false,
        error: `Update validation failed: ${validation.errors.join(', ')}`,
      };
    }

    // Clean for Firestore
    const cleanedDesign = cleanDesignForFirestore(design);
    const currentUser = getCurrentUser();

    // Get current design to check ownership
    const docRef = doc(db, DESIGNS_COLLECTION, designId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return {
        success: false,
        error: 'Design not found',
      };
    }

    const currentData = docSnap.data();
    if (currentData.userId !== currentUser.uid) {
      return {
        success: false,
        error: 'Unauthorized: Not the design owner',
      };
    }

    // Update document
    await retryOperation(async () => {
      await updateDoc(docRef, {
        metadata: cleanedDesign.metadata,
        elements: cleanedDesign.elements,
        updatedAt: Timestamp.now(),
      });
    });

    console.log('✅ [RESPONSIVE DESIGN] Updated successfully:', {
      designId,
      title: cleanedDesign.metadata.title,
      elementCount: cleanedDesign.elements.length,
    });

    return {
      success: true,
      designId,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('❌ [RESPONSIVE DESIGN] Update failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to update responsive design',
    };
  }
};

/**
 * Get design by ID
 * @param designId - Design document ID
 * @returns Responsive design document or null
 */
export const getResponsiveDesignById = async (
  designId: string
): Promise<ResponsiveDesignDocument | null> => {
  try {
    const docRef = doc(db, DESIGNS_COLLECTION, designId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return mapFirestoreDocToDesign(docSnap as QueryDocumentSnapshot<DocumentData>);
  } catch (error: any) {
    console.error('❌ [RESPONSIVE DESIGN] Get failed:', error);
    return null;
  }
};

/**
 * Get user's responsive designs
 * @param userId - User ID
 * @returns Array of responsive designs
 */
export const getUserResponsiveDesigns = async (
  userId: string
): Promise<ResponsiveDesignDocument[]> => {
  try {
    const q = query(
      collection(db, DESIGNS_COLLECTION),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc'),
      limit(100)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc =>
      mapFirestoreDocToDesign(doc as QueryDocumentSnapshot<DocumentData>)
    );
  } catch (error: any) {
    console.error('❌ [RESPONSIVE DESIGN] Get user designs failed:', error);
    return [];
  }
};

/**
 * Get public responsive designs
 * @returns Array of public responsive designs
 */
export const getPublicResponsiveDesigns = async (): Promise<ResponsiveDesignDocument[]> => {
  try {
    const q = query(
      collection(db, DESIGNS_COLLECTION),
      where('isPublic', '==', true),
      orderBy('updatedAt', 'desc'),
      limit(50)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc =>
      mapFirestoreDocToDesign(doc as QueryDocumentSnapshot<DocumentData>)
    );
  } catch (error: any) {
    console.error('❌ [RESPONSIVE DESIGN] Get public designs failed:', error);
    return [];
  }
};

/**
 * Delete responsive design
 * @param designId - Design document ID
 * @returns Success status
 */
export const deleteResponsiveDesign = async (designId: string): Promise<boolean> => {
  try {
    const docRef = doc(db, DESIGNS_COLLECTION, designId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return false;
    }

    const currentUser = getCurrentUser();
    const designData = docSnap.data();

    if (designData.userId !== currentUser.uid) {
      console.error('❌ [RESPONSIVE DESIGN] Unauthorized delete');
      return false;
    }

    await deleteDoc(docRef);
    console.log('✅ [RESPONSIVE DESIGN] Deleted successfully:', designId);
    return true;
  } catch (error: any) {
    console.error('❌ [RESPONSIVE DESIGN] Delete failed:', error);
    return false;
  }
};

/**
 * Increment view count
 */
export const incrementResponsiveDesignViews = async (designId: string): Promise<void> => {
  try {
    const docRef = doc(db, DESIGNS_COLLECTION, designId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const currentCount = docSnap.data().viewCount || 0;
      await updateDoc(docRef, {
        viewCount: currentCount + 1,
        updatedAt: Timestamp.now(),
      });
    }
  } catch (error: any) {
    console.error('❌ Failed to increment view count:', error);
  }
};

/**
 * Like responsive design
 */
export const likeResponsiveDesign = async (designId: string): Promise<void> => {
  try {
    const docRef = doc(db, DESIGNS_COLLECTION, designId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const currentUser = getCurrentUser();
      const currentLikes = docSnap.data().likes || 0;
      const likedBy = docSnap.data().likedBy || [];

      if (!likedBy.includes(currentUser.uid)) {
        await updateDoc(docRef, {
          likes: currentLikes + 1,
          likedBy: [...likedBy, currentUser.uid],
          updatedAt: Timestamp.now(),
        });
      }
    }
  } catch (error: any) {
    console.error('❌ Failed to like design:', error);
  }
};
