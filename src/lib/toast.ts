import toast from 'react-hot-toast'

export function toastSuccess(message: string) {
  toast.success(message, { duration: 2500 })
}

export function toastError(message: string) {
  toast.error(message, { duration: 3500 })
}

export function toastInfo(message: string) {
  toast(message, { duration: 2000 })
}