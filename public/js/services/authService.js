const DUMMY_USERS = [
  { email: "student@test.com", password: "123", role: "student" },
  { email: "instructor@test.com", password: "123", role: "instructor" },
  { email: "admin@test.com", password: "123", role: "admin" }
];

function saveUser(user) {
  localStorage.setItem("ce_logged_in_user", JSON.stringify(user));
}

function loadUser() {
  const raw = localStorage.getItem("ce_logged_in_user");
  return raw ? JSON.parse(raw) : null;
}

function clearUser() {
  localStorage.removeItem("ce_logged_in_user");
}

class DummyAuthService {
  async login(email, password) {
    const user = DUMMY_USERS.find(
      u => u.email === email && u.password === password
    );

    if (!user) {
      throw new Error("Invalid email or password");
    }

    saveUser(user);
    return user;
  }

  async register({ email, password, role }) {
    const exists = DUMMY_USERS.find(u => u.email === email);
    if (exists) throw new Error("User already exists");

    const newUser = { email, password, role };
    DUMMY_USERS.push(newUser);
    return newUser;
  }

  async logout() {
    clearUser();
  }

  async getCurrentUser() {
    return loadUser();
  }
}

export const authService = new DummyAuthService();
