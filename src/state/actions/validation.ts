// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';
import type { ValidationResult } from '../../core/types';
import { validateGeometry } from '../../model/validate/validateGeometry';

export function validation(store: EditorStore): ValidationResult {
  if (store.validationCache?.version === store.docVersion) return store.validationCache.result;
  const result = validateGeometry(store.doc);
  store.validationCache = { version: store.docVersion, result };
  return result;

}
