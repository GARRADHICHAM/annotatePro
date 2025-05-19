export default async function handler(req, res) {
    const { skip = 0, limit = 10 } = req.query;
    
    try {
      // Replace this URL with your actual backend API URL
      const apiUrl = `http://127.0.0.1:8000/api/images-all/?skip=${skip}&limit=${limit}`;
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Return the data from your backend
      res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching images:', error);
      res.status(500).json({ error: 'Failed to fetch images' });
    }
  }
  