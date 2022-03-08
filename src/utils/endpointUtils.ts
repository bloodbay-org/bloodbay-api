const PROD_API = 'https://bloodbay.org'
const DEV_API = 'http://127.0.0.1:3000'

export const getUIUrl = () => {
    return process.env.NODE_ENV === 'development' ? DEV_API : PROD_API
}