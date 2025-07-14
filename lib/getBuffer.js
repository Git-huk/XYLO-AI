import axios from 'axios'

/**
 * Fetch and return buffer from a URL
 * @param {string} url - URL of the media
 * @param {object} options - Axios options
 * @returns {Promise<Buffer>} - Buffer of media
 */
const getBuffer = async (url, options = {}) => {
  try {
    const response = await axios({
      method: 'GET',
      url,
      headers: {
        'DNT': '1',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent': 'Mozilla/5.0 (Xylo-Bot)',
        ...options.headers
      },
      timeout: 15000,
      responseType: 'arraybuffer',
      ...options
    })

    if (!response.data || response.status !== 200) {
      throw new Error(`Invalid response (${response.status})`)
    }

    return response.data
  } catch (err) {
    console.error(`❌ Failed to fetch buffer from ${url}:`, err.message)
    throw err
  }
}

export default getBuffer