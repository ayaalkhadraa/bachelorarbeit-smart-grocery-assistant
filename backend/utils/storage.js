import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const usersFilePath = path.join(__dirname, "../data/users.json");

/**
 * Reads all users from the local JSON file.
 * This is only prototype storage and not production-ready.
 */
export async function getUsers() {
  try {
    const data = await fs.readFile(usersFilePath, "utf-8");

    if (!data.trim()) {
      return [];
    }

    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      await saveUsers([]);
      return [];
    }

    throw error;
  }
}

/**
 * Saves all users to the local JSON file.
 */
export async function saveUsers(users) {
  const json = JSON.stringify(users, null, 2);
  await fs.writeFile(usersFilePath, json, "utf-8");
}

/**
 * Finds a user by email.
 */
export async function findUserByEmail(email) {
  const users = await getUsers();
  return users.find(
    (user) => user.email.toLowerCase() === email.toLowerCase()
  );
}

/**
 * Finds a user by id.
 */
export async function findUserById(id) {
  const users = await getUsers();
  return users.find((user) => user.id === id);
}

/**
 * Creates a new local prototype user.
 */
export async function createUser(email, name = "") {
  const users = await getUsers();

  const newUser = {
    id: crypto.randomUUID(),
    email,
    name,
    currentChallenge: null,
    credentials: [],
  };

  users.push(newUser);
  await saveUsers(users);

  return newUser;
}

/**
 * Updates an existing user.
 */
export async function updateUser(updatedUser) {
  const users = await getUsers();

  const updatedUsers = users.map((user) =>
    user.id === updatedUser.id ? updatedUser : user
  );

  await saveUsers(updatedUsers);

  return updatedUser;
}