export const isValidPassword = (password) => {
  return password && password.length >= 8
}

export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const isValidPhone = (phone) => {
  const phoneRegex = /^[0-9]{10,15}$/
  return phoneRegex.test(phone)
}

export const isValidStudentId = (studentId) => {
  return studentId && /^[A-Za-z0-9]{6,12}$/.test(studentId)
}

