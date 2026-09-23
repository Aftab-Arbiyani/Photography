import { SetMetadata } from '@nestjs/common';

/** Marks a handler whose return value should NOT be wrapped in the response envelope
 *  (e.g. raw XML for RSS/sitemap). The TransformInterceptor passes it through verbatim. */
export const RAW_RESPONSE_KEY = 'rawResponse';
export const RawResponse = () => SetMetadata(RAW_RESPONSE_KEY, true);
