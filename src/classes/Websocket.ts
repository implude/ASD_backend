import { io } from 'socket.io-client'

export default class WebsocketClient {
  public socket: any
  constructor (websocketURL: string) {
    this.socket = io(websocketURL)
  }

  public nfc (toggle: boolean) {
    toggle ? this.socket.emit('nfc_on', true) : this.socket.emit('nfc_off', true)
  }

  public studymode (toggle: boolean) {
    toggle ? this.socket.emit('study_start', true) : this.socket.emit('study_end', true)
  }

  public ledBrigt (brigtness: number) {
    this.socket.emit('LED_bright', brigtness)
  }

  public ledColor (color: String) {
    this.socket.emit('LED_color', color)
  }

  public volume (volume: number) {
    this.socket.emit('speaker_volume', volume)
  }

  public whiteNoise (index: number) {
    this.socket.emit('white_noise', index)
  }
}
