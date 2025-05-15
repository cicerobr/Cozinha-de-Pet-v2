import { 
  users, type User, type InsertUser,
  pets, type Pet, type InsertPet,
  recipes, type Recipe, type InsertRecipe,
  comments, type Comment, type InsertComment,
  favorites, type Favorite, type InsertFavorite,
  followers, type Follower, type InsertFollower
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, like, or, isNull } from "drizzle-orm";
import * as bcrypt from "bcrypt";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  
  // Pet operations
  getPet(id: number): Promise<Pet | undefined>;
  getPetsByUser(userId: number): Promise<Pet[]>;
  createPet(pet: InsertPet): Promise<Pet>;
  updatePet(id: number, pet: Partial<InsertPet>): Promise<Pet | undefined>;
  deletePet(id: number): Promise<boolean>;
  
  // Recipe operations
  getRecipe(id: number): Promise<Recipe | undefined>;
  getRecipes(options?: {
    petType?: string;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<Recipe[]>;
  getRecipesByUser(userId: number): Promise<Recipe[]>;
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  updateRecipe(id: number, recipe: Partial<InsertRecipe>): Promise<Recipe | undefined>;
  deleteRecipe(id: number): Promise<boolean>;
  incrementCookCount(id: number): Promise<Recipe | undefined>;
  
  // Comment operations
  getComments(recipeId: number): Promise<Comment[]>;
  getReplies(commentId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: number): Promise<boolean>;
  
  // Favorite operations
  getFavorites(userId: number): Promise<Recipe[]>;
  isFavorite(userId: number, recipeId: number): Promise<boolean>;
  addFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: number, recipeId: number): Promise<boolean>;
  
  // Follow operations
  getFollowers(userId: number): Promise<User[]>;
  getFollowing(userId: number): Promise<User[]>;
  isFollowing(followerId: number, followingId: number): Promise<boolean>;
  follow(follower: InsertFollower): Promise<Follower>;
  unfollow(followerId: number, followingId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (user) {
      // Don't return the password
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    }
    return undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        password: hashedPassword
      })
      .returning();
    
    // Don't return the password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    // If updating password, hash it
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }
    
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    
    if (user) {
      // Don't return the password
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    }
    
    return undefined;
  }

  // Pet operations
  async getPet(id: number): Promise<Pet | undefined> {
    const [pet] = await db.select().from(pets).where(eq(pets.id, id));
    return pet;
  }

  async getPetsByUser(userId: number): Promise<Pet[]> {
    return db.select().from(pets).where(eq(pets.userId, userId));
  }

  async createPet(petData: InsertPet): Promise<Pet> {
    const [pet] = await db.insert(pets).values(petData).returning();
    return pet;
  }

  async updatePet(id: number, petData: Partial<InsertPet>): Promise<Pet | undefined> {
    const [pet] = await db
      .update(pets)
      .set({ ...petData, updatedAt: new Date() })
      .where(eq(pets.id, id))
      .returning();
    
    return pet;
  }

  async deletePet(id: number): Promise<boolean> {
    const result = await db.delete(pets).where(eq(pets.id, id));
    return true;
  }

  // Recipe operations
  async getRecipe(id: number): Promise<Recipe | undefined> {
    const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id));
    return recipe;
  }

  async getRecipes(options?: {
    petType?: string;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<Recipe[]> {
    const limit = options?.limit || 10;
    const offset = options?.page ? (options.page - 1) * limit : 0;
    
    let query = db.select()
      .from(recipes)
      .orderBy(desc(recipes.createdAt))
      .limit(limit)
      .offset(offset);
    
    if (options?.petType) {
      query = query.where(eq(recipes.petType, options.petType));
    }
    
    if (options?.category) {
      query = query.where(eq(recipes.category, options.category));
    }
    
    if (options?.search) {
      query = query.where(
        or(
          like(recipes.title, `%${options.search}%`),
          like(recipes.ingredients, `%${options.search}%`)
        )
      );
    }
    
    return query;
  }

  async getRecipesByUser(userId: number): Promise<Recipe[]> {
    return db
      .select()
      .from(recipes)
      .where(eq(recipes.userId, userId))
      .orderBy(desc(recipes.createdAt));
  }

  async createRecipe(recipeData: InsertRecipe): Promise<Recipe> {
    const [recipe] = await db.insert(recipes).values(recipeData).returning();
    return recipe;
  }

  async updateRecipe(id: number, recipeData: Partial<InsertRecipe>): Promise<Recipe | undefined> {
    const [recipe] = await db
      .update(recipes)
      .set({ ...recipeData, updatedAt: new Date() })
      .where(eq(recipes.id, id))
      .returning();
    
    return recipe;
  }

  async deleteRecipe(id: number): Promise<boolean> {
    await db.delete(recipes).where(eq(recipes.id, id));
    return true;
  }

  async incrementCookCount(id: number): Promise<Recipe | undefined> {
    const [recipe] = await db
      .update(recipes)
      .set({ 
        cookCount: recipes.cookCount + 1,
        updatedAt: new Date()
      })
      .where(eq(recipes.id, id))
      .returning();
    
    return recipe;
  }

  // Comment operations
  async getComments(recipeId: number): Promise<Comment[]> {
    return db
      .select()
      .from(comments)
      .where(
        and(
          eq(comments.recipeId, recipeId),
          isNull(comments.parentId)
        )
      )
      .orderBy(desc(comments.createdAt));
  }

  async getReplies(commentId: number): Promise<Comment[]> {
    return db
      .select()
      .from(comments)
      .where(eq(comments.parentId, commentId))
      .orderBy(desc(comments.createdAt));
  }

  async createComment(commentData: InsertComment): Promise<Comment> {
    const [comment] = await db.insert(comments).values(commentData).returning();
    return comment;
  }

  async deleteComment(id: number): Promise<boolean> {
    await db.delete(comments).where(eq(comments.id, id));
    return true;
  }

  // Favorite operations
  async getFavorites(userId: number): Promise<Recipe[]> {
    const favoriteRecipes = await db
      .select({
        recipe: recipes
      })
      .from(favorites)
      .innerJoin(recipes, eq(favorites.recipeId, recipes.id))
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt));
    
    return favoriteRecipes.map(item => item.recipe);
  }

  async isFavorite(userId: number, recipeId: number): Promise<boolean> {
    const [favorite] = await db
      .select()
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.recipeId, recipeId)
        )
      );
    
    return !!favorite;
  }

  async addFavorite(favoriteData: InsertFavorite): Promise<Favorite> {
    const [favorite] = await db.insert(favorites).values(favoriteData).returning();
    return favorite;
  }

  async removeFavorite(userId: number, recipeId: number): Promise<boolean> {
    await db
      .delete(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.recipeId, recipeId)
        )
      );
    
    return true;
  }

  // Follow operations
  async getFollowers(userId: number): Promise<User[]> {
    const followerUsers = await db
      .select({
        user: users
      })
      .from(followers)
      .innerJoin(users, eq(followers.followerId, users.id))
      .where(eq(followers.followingId, userId));
    
    return followerUsers.map(item => {
      // Don't return passwords
      const { password, ...userWithoutPassword } = item.user;
      return userWithoutPassword as User;
    });
  }

  async getFollowing(userId: number): Promise<User[]> {
    const followingUsers = await db
      .select({
        user: users
      })
      .from(followers)
      .innerJoin(users, eq(followers.followingId, users.id))
      .where(eq(followers.followerId, userId));
    
    return followingUsers.map(item => {
      // Don't return passwords
      const { password, ...userWithoutPassword } = item.user;
      return userWithoutPassword as User;
    });
  }

  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const [follow] = await db
      .select()
      .from(followers)
      .where(
        and(
          eq(followers.followerId, followerId),
          eq(followers.followingId, followingId)
        )
      );
    
    return !!follow;
  }

  async follow(followerData: InsertFollower): Promise<Follower> {
    const [follow] = await db.insert(followers).values(followerData).returning();
    return follow;
  }

  async unfollow(followerId: number, followingId: number): Promise<boolean> {
    await db
      .delete(followers)
      .where(
        and(
          eq(followers.followerId, followerId),
          eq(followers.followingId, followingId)
        )
      );
    
    return true;
  }
}

export const storage = new DatabaseStorage();
