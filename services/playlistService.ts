import api from '../utils/api';

export interface PlaylistDesignReference {
  designId: string;
  duration: number;
  order: number;
}

export interface PlaylistDocument {
  id: string;
  name: string;
  description: string;
  userId: string;
  userEmail?: string;
  designReferences: PlaylistDesignReference[];
  totalDuration: number;
  itemCount?: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  tblplaylistitems?: any[];
}

// --- API Functions ---

export const getPlaylistsFromBackend = async () => {
  try {
    const response = await api.get('/design/getplaylists');
    return response.data;
  } catch (error: any) {
    return { success: false, msg: error.response?.data?.msg || error.message };
  }
};

export const getPlaylistDetailsFromBackend = async (id: string) => {
  try {
    const response = await api.get(`/design/getplaylistdetails?id=${id}`);
    return response.data;
  } catch (error: any) {
    return { success: false, msg: error.response?.data?.msg || error.message };
  }
};

export const savePlaylistToBackend = async (data: {
  id?: string;
  name: string;
  description?: string;
  userID?: string
}) => {
  try {
    const response = await api.post('/design/postsaveplaylist', data);
    return response.data;
  } catch (error: any) {
    return { success: false, msg: error.response?.data?.msg || error.message };
  }
};

export const syncPlaylistItemsToBackend = async (
  playlistId: string,
  items: Array<{ designId: string; slno: number; duration: number }>,
  userID?: string
) => {
  try {
    const response = await api.post('/design/postsyncplaylistitems', { playlistId, items, userID });
    return response.data;
  } catch (error: any) {
    return { success: false, msg: error.response?.data?.msg || error.message };
  }
};

export const deletePlaylistFromBackend = async (id: string) => {
  try {
    const response = await api.post('/design/postdelplaylist', { id });
    return response.data;
  } catch (error: any) {
    return { success: false, msg: error.response?.data?.msg || error.message };
  }
};

export const duplicatePlaylist = async (id: string) => {
  try {
    const original = await getPlaylistDetailsFromBackend(id);
    if (!original.success) throw new Error("Original not found");

    const createRes = await savePlaylistToBackend({
      name: `${original.data.name} (Copy)`,
      description: original.data.description,
      userID: original.data.userId
    });

    if (!createRes.success) throw new Error("Creation failed");

    const items = original.data.tblplaylistitems.map((item: any) => ({
      designId: item.designId,
      slno: item.slno,
      duration: item.duration
    }));

    await syncPlaylistItemsToBackend(createRes.data.id, items, original.data.userId);

    return { success: true, playlistId: createRes.data.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getAllPlaylists = async () => {
  try {
    // WAS: /playlist/getallplaylists (Wrong)
    // NOW: /design/getplaylists (Correct)
    const response = await api.get('/design/getplaylists');
    return response.data;
  } catch (error) {
    console.error("Error fetching playlists:", error);
    return { success: false, data: [] };
  }
};



// --- Fallback / Stub Methods (To satisfy older calls if they exist) ---
export const getPlaylistById = async (id: string) => null;
export const getUserPlaylists = async (limit: number) => [];
export const updatePlaylist = async (id: string, data: any) => ({ success: false, error: "Not supported" });
export const addDesignToPlaylist = async () => ({ success: false });
export const removeDesignFromPlaylist = async () => ({ success: false });