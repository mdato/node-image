const express = require('express');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuración de Multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

// Definición del modelo de Post
const postSchema = new mongoose.Schema({
  title: String,
  description: String,
  imageUrl: String
});

const Post = mongoose.model('Post', postSchema);

// Ruta para crear una publicación
app.post('/api/posts', upload.single('image'), async (req, res) => {
  try {
    const { title, description } = req.body;
    let imageUrl = '';

    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            return reject(error);
          }
          resolve(result);
        }).end(req.file.buffer);
      });

      imageUrl = result.secure_url;
    }

    const newPost = new Post({
      title,
      description,
      imageUrl
    });

    await newPost.save();
    res.status(201).json(newPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});


/*-------------------------------------*/

// Ruta para eliminar una publicación
app.delete('/api/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Elimina el post por ID
    const deletedPost = await Post.findByIdAndDelete(id);

    if (!deletedPost) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Si la publicación tenía una imagen en Cloudinary, puedes eliminarla también (opcional)
    if (deletedPost.imageUrl) {
      const publicId = deletedPost.imageUrl.split('/').pop().split('.')[0]; // Extrae el publicId de la URL
      await cloudinary.uploader.destroy(publicId);
    }

    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});


/*-----------------------------------------*/


// Ruta para modificar una publicación
app.put('/api/posts/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    const file = req.file;

    // Busca el post por ID
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Actualiza los campos del post
    if (title) post.title = title;
    if (description) post.description = description;

    // Si se proporciona un nuevo archivo de imagen, actualiza la imagen en Cloudinary
    if (file) {
      // Elimina la imagen antigua de Cloudinary si existe
      if (post.imageUrl) {
        const publicId = post.imageUrl.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      }

      // Sube la nueva imagen
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            return reject(error);
          }
          resolve(result);
        }).end(file.buffer);
      });

      post.imageUrl = result.secure_url;
    }

    // Guarda los cambios
    await post.save();
    res.status(200).json(post);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});



/*----------------------------------------------*/

// Ruta para obtener todas las publicaciones
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find();
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Inicia el servidor
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
