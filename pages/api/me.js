// pages/api/me.js - API route to proxy the backend /me endpoint
export default async function handler(req, res) {
    // Get token from request cookies or headers
    const token = req.headers.authorization?.split(' ')[1] || 
                  req.cookies?.accessToken;
  
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  
    try {
      // Forward the request to your FastAPI backend
      const response = await fetch('http://127.0.0.1:8000/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
  
      if (!response.ok) {
        return res.status(response.status).json({ message: 'Failed to fetch user data' });
      }
  
      const userData = await response.json();
      return res.status(200).json(userData);
    } catch (error) {
      console.error('Error fetching user data:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }