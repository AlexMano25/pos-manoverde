// ---------------------------------------------------------------------------
// Web Bluetooth API Type Declarations
// ---------------------------------------------------------------------------
// The Web Bluetooth API is not yet included in TypeScript's standard DOM
// typings. This file provides the necessary type declarations so that
// the POS app's Bluetooth printer service can compile without errors.
// Spec reference: https://webbluetoothcg.github.io/web-bluetooth/
// ---------------------------------------------------------------------------

type BluetoothServiceUUID = number | string
type BluetoothCharacteristicUUID = number | string
type BluetoothDescriptorUUID = number | string

interface BluetoothRequestDeviceFilter {
  services?: BluetoothServiceUUID[]
  name?: string
  namePrefix?: string
  manufacturerData?: Array<{
    companyIdentifier: number
    dataPrefix?: BufferSource
    mask?: BufferSource
  }>
  serviceData?: Array<{
    service: BluetoothServiceUUID
    dataPrefix?: BufferSource
    mask?: BufferSource
  }>
}

interface RequestDeviceOptions {
  filters?: BluetoothRequestDeviceFilter[]
  optionalServices?: BluetoothServiceUUID[]
  optionalManufacturerData?: number[]
  acceptAllDevices?: boolean
}

interface BluetoothRemoteGATTDescriptor {
  readonly characteristic: BluetoothRemoteGATTCharacteristic
  readonly uuid: string
  readonly value?: DataView
  readValue(): Promise<DataView>
  writeValue(value: BufferSource): Promise<void>
}

interface BluetoothCharacteristicProperties {
  readonly broadcast: boolean
  readonly read: boolean
  readonly writeWithoutResponse: boolean
  readonly write: boolean
  readonly notify: boolean
  readonly indicate: boolean
  readonly authenticatedSignedWrites: boolean
  readonly reliableWrite: boolean
  readonly writableAuxiliaries: boolean
}

interface BluetoothRemoteGATTCharacteristic extends EventTarget {
  readonly service: BluetoothRemoteGATTService
  readonly uuid: string
  readonly properties: BluetoothCharacteristicProperties
  readonly value?: DataView
  getDescriptor(descriptor: BluetoothDescriptorUUID): Promise<BluetoothRemoteGATTDescriptor>
  getDescriptors(descriptor?: BluetoothDescriptorUUID): Promise<BluetoothRemoteGATTDescriptor[]>
  readValue(): Promise<DataView>
  writeValue(value: BufferSource): Promise<void>
  writeValueWithResponse(value: BufferSource): Promise<void>
  writeValueWithoutResponse(value: BufferSource): Promise<void>
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>
  stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>
  addEventListener(
    type: 'characteristicvaluechanged',
    listener: (this: BluetoothRemoteGATTCharacteristic, ev: Event) => void,
    options?: boolean | AddEventListenerOptions,
  ): void
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void
  removeEventListener(
    type: 'characteristicvaluechanged',
    listener: (this: BluetoothRemoteGATTCharacteristic, ev: Event) => void,
    options?: boolean | EventListenerOptions,
  ): void
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void
}

interface BluetoothRemoteGATTService extends EventTarget {
  readonly device: BluetoothDevice
  readonly uuid: string
  readonly isPrimary: boolean
  getCharacteristic(characteristic: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic>
  getCharacteristics(characteristic?: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic[]>
  getIncludedService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>
  getIncludedServices(service?: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService[]>
  addEventListener(
    type: 'serviceadded' | 'servicechanged' | 'serviceremoved',
    listener: (this: BluetoothRemoteGATTService, ev: Event) => void,
    options?: boolean | AddEventListenerOptions,
  ): void
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void
  removeEventListener(
    type: 'serviceadded' | 'servicechanged' | 'serviceremoved',
    listener: (this: BluetoothRemoteGATTService, ev: Event) => void,
    options?: boolean | EventListenerOptions,
  ): void
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void
}

interface BluetoothRemoteGATTServer {
  readonly device: BluetoothDevice
  readonly connected: boolean
  connect(): Promise<BluetoothRemoteGATTServer>
  disconnect(): void
  getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>
  getPrimaryServices(service?: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService[]>
}

interface BluetoothDevice extends EventTarget {
  readonly id: string
  readonly name?: string
  readonly gatt?: BluetoothRemoteGATTServer
  readonly watchingAdvertisements: boolean
  watchAdvertisements(options?: { signal?: AbortSignal }): Promise<void>
  addEventListener(
    type: 'gattserverdisconnected',
    listener: (this: BluetoothDevice, ev: Event) => void,
    options?: boolean | AddEventListenerOptions,
  ): void
  addEventListener(
    type: 'advertisementreceived',
    listener: (this: BluetoothDevice, ev: Event) => void,
    options?: boolean | AddEventListenerOptions,
  ): void
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void
  removeEventListener(
    type: 'gattserverdisconnected',
    listener: (this: BluetoothDevice, ev: Event) => void,
    options?: boolean | EventListenerOptions,
  ): void
  removeEventListener(
    type: 'advertisementreceived',
    listener: (this: BluetoothDevice, ev: Event) => void,
    options?: boolean | EventListenerOptions,
  ): void
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void
}

interface Bluetooth extends EventTarget {
  getAvailability(): Promise<boolean>
  requestDevice(options?: RequestDeviceOptions): Promise<BluetoothDevice>
  getDevices(): Promise<BluetoothDevice[]>
  addEventListener(
    type: 'availabilitychanged',
    listener: (this: Bluetooth, ev: Event) => void,
    options?: boolean | AddEventListenerOptions,
  ): void
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void
  removeEventListener(
    type: 'availabilitychanged',
    listener: (this: Bluetooth, ev: Event) => void,
    options?: boolean | EventListenerOptions,
  ): void
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void
}

// Extend the Navigator interface to include the bluetooth property
interface Navigator {
  readonly bluetooth: Bluetooth
}
