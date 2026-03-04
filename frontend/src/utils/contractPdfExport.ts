import type { ContractTemplate } from '../types'

export function generateContractPdf(
  template: ContractTemplate,
  formData: Record<string, string>,
  storeName: string,
  storeAddress?: string,
  storePhone?: string,
): void {
  // TODO: implement with jsPDF
  console.log('Generating contract PDF:', template.key, formData)
  console.log('Store info:', storeName, storeAddress, storePhone)
  alert(`PDF "${template.key}" generated (placeholder)`)
}
