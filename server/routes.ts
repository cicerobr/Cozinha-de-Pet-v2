import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import express from "express";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertPetSchema, 
  insertRecipeSchema,
  insertCommentSchema,
  insertFavoriteSchema,
  insertFollowerSchema
} from "@shared/schema";
import * as bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";
import session from "express-session";

// Set up multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({ 
  storage: fileStorage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Authentication middleware
const authenticate = async (req: Request, res: Response, next: Function) => {
  const userId = req.session?.userId;
  
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const user = await storage.getUser(userId);
  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }
  
  req.user = user;
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Handle uploads directory for images
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
  
  // Set up session
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "cozinha-pet-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 } // 1 week
    })
  );
  
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      const user = await storage.createUser(userData);
      
      // Set up session
      req.session.userId = user.id;
      
      res.status(201).json(user);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Invalid data provided", error: error.message });
    }
  });
  
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }
      
      // Find user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Set up session
      req.session.userId = user.id;
      
      // Don't return the password
      const { password: _, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
  
  app.get("/api/auth/me", authenticate, (req, res) => {
    res.json(req.user);
  });
  
  // Pet routes
  app.get("/api/pets", authenticate, async (req, res) => {
    try {
      const pets = await storage.getPetsByUser(req.user.id);
      res.json(pets);
    } catch (error) {
      console.error("Get pets error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/pets/:id", async (req, res) => {
    try {
      const pet = await storage.getPet(parseInt(req.params.id));
      if (!pet) {
        return res.status(404).json({ message: "Pet not found" });
      }
      res.json(pet);
    } catch (error) {
      console.error("Get pet error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/pets", authenticate, upload.single("profileImage"), async (req, res) => {
    try {
      const petData = insertPetSchema.parse({
        ...req.body,
        userId: req.user.id,
        profileImageUrl: req.file ? `/uploads/${req.file.filename}` : undefined
      });
      
      const pet = await storage.createPet(petData);
      res.status(201).json(pet);
    } catch (error) {
      console.error("Create pet error:", error);
      res.status(400).json({ message: "Invalid data provided", error: error.message });
    }
  });
  
  app.put("/api/pets/:id", authenticate, upload.single("profileImage"), async (req, res) => {
    try {
      const petId = parseInt(req.params.id);
      const pet = await storage.getPet(petId);
      
      if (!pet) {
        return res.status(404).json({ message: "Pet not found" });
      }
      
      if (pet.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const updateData: any = { ...req.body };
      if (req.file) {
        updateData.profileImageUrl = `/uploads/${req.file.filename}`;
      }
      
      const updatedPet = await storage.updatePet(petId, updateData);
      res.json(updatedPet);
    } catch (error) {
      console.error("Update pet error:", error);
      res.status(400).json({ message: "Invalid data provided", error: error.message });
    }
  });
  
  app.delete("/api/pets/:id", authenticate, async (req, res) => {
    try {
      const petId = parseInt(req.params.id);
      const pet = await storage.getPet(petId);
      
      if (!pet) {
        return res.status(404).json({ message: "Pet not found" });
      }
      
      if (pet.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      await storage.deletePet(petId);
      res.json({ message: "Pet deleted successfully" });
    } catch (error) {
      console.error("Delete pet error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Recipe routes
  app.get("/api/recipes", async (req, res) => {
    try {
      const { petType, category, search, page, limit } = req.query;
      
      const recipes = await storage.getRecipes({
        petType: petType as string,
        category: category as string,
        search: search as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined
      });
      
      res.json(recipes);
    } catch (error) {
      console.error("Get recipes error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/recipes/:id", async (req, res) => {
    try {
      const recipe = await storage.getRecipe(parseInt(req.params.id));
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      res.json(recipe);
    } catch (error) {
      console.error("Get recipe error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/users/:userId/recipes", async (req, res) => {
    try {
      const recipes = await storage.getRecipesByUser(parseInt(req.params.userId));
      res.json(recipes);
    } catch (error) {
      console.error("Get user recipes error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/recipes", authenticate, upload.single("image"), async (req, res) => {
    try {
      // Garantir que o prepTime seja um número
      const formData = {
        ...req.body,
        prepTime: req.body.prepTime ? parseInt(req.body.prepTime) : undefined,
        userId: req.user.id,
        imageUrl: req.file ? `/uploads/${req.file.filename}` : undefined
      };
      
      const recipeData = insertRecipeSchema.parse(formData);
      
      const recipe = await storage.createRecipe(recipeData);
      res.status(201).json(recipe);
    } catch (error) {
      console.error("Create recipe error:", error);
      res.status(400).json({ message: "Invalid data provided", error: error.message });
    }
  });
  
  app.put("/api/recipes/:id", authenticate, upload.single("image"), async (req, res) => {
    try {
      const recipeId = parseInt(req.params.id);
      const recipe = await storage.getRecipe(recipeId);
      
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      
      if (recipe.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const updateData: any = { ...req.body };
      if (req.file) {
        updateData.imageUrl = `/uploads/${req.file.filename}`;
      }
      
      const updatedRecipe = await storage.updateRecipe(recipeId, updateData);
      res.json(updatedRecipe);
    } catch (error) {
      console.error("Update recipe error:", error);
      res.status(400).json({ message: "Invalid data provided", error: error.message });
    }
  });
  
  app.delete("/api/recipes/:id", authenticate, async (req, res) => {
    try {
      const recipeId = parseInt(req.params.id);
      const recipe = await storage.getRecipe(recipeId);
      
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      
      if (recipe.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      await storage.deleteRecipe(recipeId);
      res.json({ message: "Recipe deleted successfully" });
    } catch (error) {
      console.error("Delete recipe error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/recipes/:id/cook", authenticate, async (req, res) => {
    try {
      const recipeId = parseInt(req.params.id);
      const recipe = await storage.getRecipe(recipeId);
      
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      
      const updatedRecipe = await storage.incrementCookCount(recipeId);
      res.json(updatedRecipe);
    } catch (error) {
      console.error("Cook recipe error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Comment routes
  app.get("/api/recipes/:recipeId/comments", async (req, res) => {
    try {
      const recipeId = parseInt(req.params.recipeId);
      const comments = await storage.getComments(recipeId);
      res.json(comments);
    } catch (error) {
      console.error("Get comments error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/comments/:commentId/replies", async (req, res) => {
    try {
      const commentId = parseInt(req.params.commentId);
      const replies = await storage.getReplies(commentId);
      res.json(replies);
    } catch (error) {
      console.error("Get replies error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/recipes/:recipeId/comments", authenticate, async (req, res) => {
    try {
      const recipeId = parseInt(req.params.recipeId);
      const recipe = await storage.getRecipe(recipeId);
      
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      
      const commentData = insertCommentSchema.parse({
        ...req.body,
        userId: req.user.id,
        recipeId
      });
      
      const comment = await storage.createComment(commentData);
      res.status(201).json(comment);
    } catch (error) {
      console.error("Create comment error:", error);
      res.status(400).json({ message: "Invalid data provided", error: error.message });
    }
  });
  
  app.delete("/api/comments/:id", authenticate, async (req, res) => {
    try {
      const commentId = parseInt(req.params.id);
      const [comment] = await db
        .select()
        .from(comments)
        .where(eq(comments.id, commentId));
      
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      if (comment.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      await storage.deleteComment(commentId);
      res.json({ message: "Comment deleted successfully" });
    } catch (error) {
      console.error("Delete comment error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Favorite routes
  app.get("/api/users/:userId/favorites", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const favorites = await storage.getFavorites(userId);
      res.json(favorites);
    } catch (error) {
      console.error("Get favorites error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/recipes/:recipeId/favorite", authenticate, async (req, res) => {
    try {
      const recipeId = parseInt(req.params.recipeId);
      const isFavorite = await storage.isFavorite(req.user.id, recipeId);
      res.json({ isFavorite });
    } catch (error) {
      console.error("Check favorite error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/recipes/:recipeId/favorite", authenticate, async (req, res) => {
    try {
      const recipeId = parseInt(req.params.recipeId);
      const recipe = await storage.getRecipe(recipeId);
      
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      
      const isFavorite = await storage.isFavorite(req.user.id, recipeId);
      if (isFavorite) {
        return res.status(400).json({ message: "Recipe already favorited" });
      }
      
      const favoriteData = insertFavoriteSchema.parse({
        userId: req.user.id,
        recipeId
      });
      
      const favorite = await storage.addFavorite(favoriteData);
      res.status(201).json(favorite);
    } catch (error) {
      console.error("Add favorite error:", error);
      res.status(400).json({ message: "Invalid data provided", error: error.message });
    }
  });
  
  app.delete("/api/recipes/:recipeId/favorite", authenticate, async (req, res) => {
    try {
      const recipeId = parseInt(req.params.recipeId);
      const isFavorite = await storage.isFavorite(req.user.id, recipeId);
      
      if (!isFavorite) {
        return res.status(404).json({ message: "Favorite not found" });
      }
      
      await storage.removeFavorite(req.user.id, recipeId);
      res.json({ message: "Favorite removed successfully" });
    } catch (error) {
      console.error("Remove favorite error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Follow routes
  app.get("/api/users/:userId/followers", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const followers = await storage.getFollowers(userId);
      res.json(followers);
    } catch (error) {
      console.error("Get followers error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/users/:userId/following", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const following = await storage.getFollowing(userId);
      res.json(following);
    } catch (error) {
      console.error("Get following error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/users/:userId/follow", authenticate, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const isFollowing = await storage.isFollowing(req.user.id, userId);
      res.json({ isFollowing });
    } catch (error) {
      console.error("Check follow error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/users/:userId/follow", authenticate, async (req, res) => {
    try {
      const followingId = parseInt(req.params.userId);
      
      // Check if user exists
      const user = await storage.getUser(followingId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Can't follow yourself
      if (followingId === req.user.id) {
        return res.status(400).json({ message: "Cannot follow yourself" });
      }
      
      // Check if already following
      const isFollowing = await storage.isFollowing(req.user.id, followingId);
      if (isFollowing) {
        return res.status(400).json({ message: "Already following this user" });
      }
      
      const followerData = insertFollowerSchema.parse({
        followerId: req.user.id,
        followingId
      });
      
      const follow = await storage.follow(followerData);
      res.status(201).json(follow);
    } catch (error) {
      console.error("Follow error:", error);
      res.status(400).json({ message: "Invalid data provided", error: error.message });
    }
  });
  
  app.delete("/api/users/:userId/follow", authenticate, async (req, res) => {
    try {
      const followingId = parseInt(req.params.userId);
      
      // Check if following
      const isFollowing = await storage.isFollowing(req.user.id, followingId);
      if (!isFollowing) {
        return res.status(404).json({ message: "Not following this user" });
      }
      
      await storage.unfollow(req.user.id, followingId);
      res.json({ message: "Unfollowed successfully" });
    } catch (error) {
      console.error("Unfollow error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // User profile routes
  app.put("/api/users/profile", authenticate, upload.single("profileImage"), async (req, res) => {
    try {
      const updateData: any = { ...req.body };
      if (req.file) {
        updateData.profileImageUrl = `/uploads/${req.file.filename}`;
      }
      
      const updatedUser = await storage.updateUser(req.user.id, updateData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(400).json({ message: "Invalid data provided", error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Add express and session imports
import express from "express";
import session from "express-session";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { comments } from "@shared/schema";
