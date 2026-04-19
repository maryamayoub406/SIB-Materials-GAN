import api from './client'

export const loginUser = async (email, password) => {
  const formData = new URLSearchParams()
  formData.append('username', email) // OAuth2 uses 'username'
  formData.append('password', password)

  const response = await api.post('/auth/login', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
  return response.data
}

export const registerUser = async (name, email, password) => {
  const response = await api.post('/auth/register', { name, email, password })
  return response.data
}

export const getMe = async () => {
  const response = await api.get('/auth/me')
  return response.data
}
