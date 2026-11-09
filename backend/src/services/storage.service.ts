import fs from 'fs';
import path from 'path';
import { supabaseClient, SUPABASE_URL } from '../config/supabase';

export type StorageBucket = 'reports' | 'licenses' | 'avatars' | 'attachments';

const MIME_MAP: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.html': 'text/html; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

class StorageService {
  private localUploadsRoot: string;

  constructor() {
    this.localUploadsRoot = path.join(process.cwd(), 'uploads');
    this.ensureLocalDirectories();
  }

  private ensureLocalDirectories() {
    const buckets: StorageBucket[] = ['reports', 'licenses', 'avatars', 'attachments'];
    for (const b of buckets) {
      const dir = path.join(this.localUploadsRoot, b);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  /**
   * Upload a file to Supabase Storage bucket with local backup.
   * Returns the permanent public CDN URL if Supabase is active, or local relative path as fallback.
   */
  async uploadFile(
    bucket: StorageBucket,
    fileName: string,
    fileBuffer: Buffer,
    mimeType?: string
  ): Promise<{ fileUrl: string; fileName: string; isSupabase: boolean; size: number }> {
    const ext = path.extname(fileName).toLowerCase();
    const resolvedMime = mimeType || MIME_MAP[ext] || 'application/octet-stream';

    // 1. Always write to local storage as resilient persistent cache
    const localBucketDir = path.join(this.localUploadsRoot, bucket);
    if (!fs.existsSync(localBucketDir)) {
      fs.mkdirSync(localBucketDir, { recursive: true });
    }
    const localFilePath = path.join(localBucketDir, fileName);
    fs.writeFileSync(localFilePath, fileBuffer);

    // 2. Upload to Supabase Storage if client is configured
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient.storage
          .from(bucket)
          .upload(fileName, fileBuffer, {
            contentType: resolvedMime,
            upsert: true,
          });

        if (error) {
          console.error(`[StorageService] Supabase upload error in bucket "${bucket}":`, error.message);
        } else if (data) {
          const { data: publicUrlData } = supabaseClient.storage
            .from(bucket)
            .getPublicUrl(fileName);

          const publicUrl = publicUrlData?.publicUrl || `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${fileName}`;
          console.log(`[StorageService] Uploaded to Supabase bucket "${bucket}":`, publicUrl);

          return {
            fileUrl: publicUrl,
            fileName,
            isSupabase: true,
            size: fileBuffer.length,
          };
        }
      } catch (err: any) {
        console.error(`[StorageService] Supabase upload exception in bucket "${bucket}":`, err?.message || err);
      }
    }

    // 3. Fallback: Return relative path if Supabase is not configured yet
    const fallbackUrl = `/uploads/${bucket}/${fileName}`;
    console.warn(`[StorageService] File saved locally to: ${fallbackUrl}`);
    return {
      fileUrl: fallbackUrl,
      fileName,
      isSupabase: false,
      size: fileBuffer.length,
    };
  }

  /**
   * Delete a file from both Supabase Storage and local disk.
   */
  async deleteFile(bucket: StorageBucket, fileUrlOrName: string): Promise<boolean> {
    const fileName = path.basename(fileUrlOrName);

    // Delete local file
    try {
      const localFilePath = path.join(this.localUploadsRoot, bucket, fileName);
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
    } catch (err) {
      console.error(`[StorageService] Error deleting local file:`, err);
    }

    // Delete from Supabase Storage
    if (supabaseClient) {
      try {
        await supabaseClient.storage.from(bucket).remove([fileName]);
      } catch (err) {
        console.error(`[StorageService] Error deleting Supabase object:`, err);
      }
    }

    return true;
  }

  /**
   * Get file details or content for preview/download.
   */
  async getLocalFilePath(bucket: StorageBucket, fileName: string): Promise<string | null> {
    const localFilePath = path.join(this.localUploadsRoot, bucket, fileName);
    if (fs.existsSync(localFilePath)) {
      return localFilePath;
    }
    return null;
  }
}

export const storageService = new StorageService();
