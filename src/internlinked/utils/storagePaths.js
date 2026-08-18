import { supabase } from './supabase';

// The resumes/cvs Storage buckets are private now (see 20260817120500_storage_private_buckets
// migration) — DB columns that used to hold a public getPublicUrl() string now hold a bare
// storage path instead. This accepts either shape, so rows written before the switch (and rows
// written by not-yet-migrated flows) keep resolving correctly.
export function storagePathFromValue(bucket, value) {
    if (!value) return null;
    const publicMarker = `/storage/v1/object/public/${bucket}/`;
    const publicIdx = value.indexOf(publicMarker);
    if (publicIdx !== -1) return value.slice(publicIdx + publicMarker.length);
    const signedMarker = `/storage/v1/object/sign/${bucket}/`;
    const signedIdx = value.indexOf(signedMarker);
    if (signedIdx !== -1) return value.slice(signedIdx + signedMarker.length).split('?')[0];
    return value; // already a bare path
}

export async function getSignedUrl(bucket, value, expiresIn = 3600) {
    const path = storagePathFromValue(bucket, value);
    if (!path) return null;
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
    if (error) {
        console.error(`[storage] signed URL failed for ${bucket}/${path}:`, error.message);
        return null;
    }
    return data.signedUrl;
}
