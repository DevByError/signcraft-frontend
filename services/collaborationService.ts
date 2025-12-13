import { CollaborativeSession, Design } from '../types';

const API_BASE = 'http://localhost:5000/api';

/**
 * Create or join a collaborative session
 * @param designId - Design ID to collaborate on
 * @param userId - User ID joining the session
 * @returns CollaborativeSession details
 */
export async function createOrJoinSession(designId: string, userId: string): Promise<CollaborativeSession> {
  try {
    const response = await fetch(`${API_BASE}/collaboration/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ designId, userId }),
    });

    if (!response.ok) {
      throw new Error(`Session creation failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Collaboration session error:', error);
    throw error;
  }
}

/**
 * Get active collaborators for a design
 * @param designId - Design ID
 */
export async function getCollaborators(designId: string): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE}/collaboration/collaborators/${designId}`);

    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.collaborators || [];
  } catch (error) {
    console.error('Collaborators fetch error:', error);
    return [];
  }
}

/**
 * Save design with auto-save capabilities
 * @param design - Design object to save
 * @param userId - User ID saving the design
 */
export async function saveDesign(design: Design, userId: string): Promise<Design> {
  try {
    const response = await fetch(`${API_BASE}/designs/${design.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...design,
        lastModified: new Date().toISOString(),
        ownerId: userId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Save failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Design save error:', error);
    throw error;
  }
}

/**
 * Share design with other users
 * @param designId - Design ID
 * @param userIds - Array of user IDs to share with
 */
export async function shareDesign(designId: string, userIds: string[]): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/designs/${designId}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collaborators: userIds }),
    });

    if (!response.ok) {
      throw new Error(`Share failed: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Design share error:', error);
    throw error;
  }
}

/**
 * Broadcast design changes to collaborators (WebSocket event)
 * @param designId - Design ID
 * @param changes - Changes object
 */
export function broadcastChanges(designId: string, changes: any): void {
  // This would be used with WebSocket in a real implementation
  const event = new CustomEvent('designChanged', {
    detail: { designId, changes, timestamp: new Date().toISOString() },
  });
  window.dispatchEvent(event);
}

/**
 * Listen for design changes from collaborators
 * @param callback - Function to call when changes are detected
 */
export function onDesignChanged(callback: (event: any) => void): () => void {
  window.addEventListener('designChanged', callback);
  return () => window.removeEventListener('designChanged', callback);
}
