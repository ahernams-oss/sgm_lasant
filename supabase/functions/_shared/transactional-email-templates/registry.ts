/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as cotacaoConfirmation } from './cotacao-confirmation.tsx'
import { template as ordemCompraConfirmation } from './ordem-compra-confirmation.tsx'
import { template as passwordReset } from './password-reset.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'cotacao-confirmation': cotacaoConfirmation,
  'ordem-compra-confirmation': ordemCompraConfirmation,
  'password-reset': passwordReset,
}
