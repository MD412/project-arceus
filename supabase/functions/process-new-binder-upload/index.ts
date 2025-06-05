    // supabase/functions/process-new-binder-upload/index.ts
    import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
    import { createClient, PostgrestError, StorageError } from 'https://esm.sh/@supabase/supabase-js@2'

    console.log(`[${new Date().toISOString()}] Function "process-new-binder-upload" global scope.`);

    const supabaseAdminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    function createJsonResponse(status: number, body: unknown) {
      const responseBody = typeof body === 'string' && status !== 200 
                           ? JSON.stringify({ error: body }) 
                           : JSON.stringify(body);
      console.log(`[${new Date().toISOString()}] Sending response: status=${status}, body=${responseBody}`);
      return new Response(responseBody, {
        status,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }

    async function calculateSha256Hex(stream: ReadableStream<Uint8Array>): Promise<string> {
      try {
        const buffer = await new Response(stream).arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (hashError) {
        console.error(`[${new Date().toISOString()}] Error in calculateSha256Hex:`, hashError);
        throw hashError; // Re-throw to be caught by main handler
      }
    }

    serve(async (req) => {
      const requestTimestamp = new Date().toISOString();
      console.log(`[${requestTimestamp}] Received request: method=${req.method}, url=${req.url}`);
      
      // Log all request headers
      const requestHeaders: Record<string, string> = {};
      req.headers.forEach((value, key) => {
        requestHeaders[key] = value;
      });
      console.log(`[${requestTimestamp}] Request Headers:`, JSON.stringify(requestHeaders, null, 2));

      // Log raw request body as text BEFORE attempting to parse as JSON
      let rawBody: string | null = null;
      try {
        rawBody = await req.text(); // Read body as text first
        console.log(`[${requestTimestamp}] Raw request body:`, rawBody);
      } catch (textError) {
        console.error(`[${requestTimestamp}] Error reading request body as text:`, textError);
        return createJsonResponse(500, "Failed to read request body.");
      }

      if (req.method !== 'POST') {
        return createJsonResponse(405, 'Method not allowed. Use POST.');
      }

      let payload: any;
      try {
        if (rawBody === null) throw new Error("Raw body is null, cannot parse JSON.");
        payload = JSON.parse(rawBody); // Parse the already read rawBody
        console.log(`[${requestTimestamp}] Parsed JSON payload:`, JSON.stringify(payload, null, 2));
      } catch (jsonError) {
        console.error(`[${requestTimestamp}] Failed to parse JSON payload. Error:`, jsonError, "Raw body received:", rawBody);
        return createJsonResponse(400, `Invalid JSON payload: ${jsonError.message}`);
      }

      const record = payload?.record;
      if (!record || payload.type !== 'INSERT' || payload.schema !== 'storage' || payload.table !== 'objects') {
        console.warn(`[${requestTimestamp}] Payload is not a valid storage insert event:`, payload);
        return createJsonResponse(400, 'Invalid payload: Not a storage INSERT event.');
      }

      const bucketId = record.bucket_id;
      const storagePath = record.name;
      const userId = record.owner;

      if (!userId) {
        console.error(`[${requestTimestamp}] User ID (owner) not found in storage object metadata.`);
        return createJsonResponse(400, 'User ID not found in upload metadata. Uploads must be authenticated.');
      }

      console.log(`[${requestTimestamp}] Processing file: ${storagePath} in bucket: ${bucketId} for user: ${userId}`);

      try {
        const { data: fileBlob, error: downloadError } = await supabaseAdminClient.storage
          .from(bucketId)
          .download(storagePath);

        if (downloadError || !fileBlob) {
          console.error(`[${requestTimestamp}] Error downloading file "${storagePath}" from bucket "${bucketId}". Supabase Storage Error:`, downloadError);
          // Log more details if it's a StorageError
          if (downloadError && (downloadError as StorageError).message) {
             throw new Error(`Storage download failed: ${(downloadError as StorageError).message} (status: ${(downloadError as any).status || 'unknown'})`);
          }
          throw new Error(downloadError?.message || 'Failed to download file: No data or unknown error.');
        }
        console.log(`[${requestTimestamp}] File downloaded successfully. Size: ${fileBlob.size}`);

        const contentHash = await calculateSha256Hex(fileBlob.stream());
        console.log(`[${requestTimestamp}] Calculated SHA-256 hash: ${contentHash}`);

        const { data: rpcData, error: rpcError } = await supabaseAdminClient
          .rpc('enqueue_binder_upload', {
            p_user_id: userId,
            p_storage_path: storagePath,
            p_content_hash: contentHash,
          });

        if (rpcError) {
          console.error(`[${requestTimestamp}] Error calling RPC 'enqueue_binder_upload':`, rpcError);
          throw rpcError; // Let the main catch handler deal with it
        }

        console.log(`[${requestTimestamp}] RPC 'enqueue_binder_upload' successful:`, rpcData);
        return createJsonResponse(200, rpcData);

      } catch (e: any) {
        let detailedErrorMessage = 'An error occurred during file processing or DB operation.';
        let errorDetails: Record<string, any> = { name: e.name, message: e.message, stack: e.stack };
        
        console.error(`[${requestTimestamp}] --- DETAILED ERROR IN CATCH BLOCK ---`);
        console.error(`[${requestTimestamp}] Message: ${e.message}`);
        console.error(`[${requestTimestamp}] Name: ${e.name}`);
        console.error(`[${requestTimestamp}] Stack: ${e.stack}`);
        console.error(`[${requestTimestamp}] Full Error Object (raw):`, e); // Log the raw error
        try {
            console.error(`[${requestTimestamp}] Full Error Object (JSON.stringified):`, JSON.stringify(e, Object.getOwnPropertyNames(e), 2));
        } catch (jsonErr) {
            console.error(`[${requestTimestamp}] Could not stringify full error object:`, jsonErr);
        }
        console.error(`[${requestTimestamp}] --- DETAILED ERROR END ---`);
        
        if (e.isStorageError) {
            detailedErrorMessage = `Storage Error: ${e.message}`;
            errorDetails.isStorageError = true;
            errorDetails.originalError = e.originalError;
        } else if (e.code) { // For PostgrestError
            detailedErrorMessage = `Database RPC Error: ${e.message} (code: ${e.code})`;
            errorDetails.code = e.code;
            errorDetails.details = e.details;
            errorDetails.hint = e.hint;
        }
        
        return createJsonResponse(500, { error: detailedErrorMessage, details: errorDetails });
      }
    });