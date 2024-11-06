// Initialize data structure in localStorage
if (!localStorage.getItem("users")) {
  localStorage.setItem("users", JSON.stringify({}));
}
if (!localStorage.getItem("posts")) {
  localStorage.setItem("posts", JSON.stringify([]));
}

let currentUser = JSON.parse(localStorage.getItem("currentUser"));
let users = JSON.parse(localStorage.getItem("users"));
let posts = JSON.parse(localStorage.getItem("posts"));

// Update localStorage helper function
function updateStorage() {
  localStorage.setItem("users", JSON.stringify(users));
  localStorage.setItem("posts", JSON.stringify(posts));
  localStorage.setItem("currentUser", JSON.stringify(currentUser));
}

// Show/Hide modals
function showModal(modalId) {
  document.getElementById(modalId).style.display = "block";
}

function hideModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}

function showNewPostForm() {
  document.getElementById("newPostOverlay").style.display = "block";
  document.getElementById("newPostForm").style.display = "block";
}

function hideNewPostForm() {
  document.getElementById("newPostOverlay").style.display = "none";
  document.getElementById("newPostForm").style.display = "none";
}

// Handle login
function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;

  if (users[username] && users[username].password === password) {
    currentUser = username;
    updateStorage();
    updateAuthUI();
    hideModal("loginModal");
    document.getElementById("loginForm").reset();
    loadAllPosts();
  } else {
    document.getElementById("loginError").textContent =
      "Invalid username or password";
  }
}

// Handle register
function handleRegister(event) {
  event.preventDefault();
  const username = document.getElementById("registerUsername").value;
  const password = document.getElementById("registerPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const profilePicture = document.getElementById("profilePicture").files[0];

  if (users[username]) {
    document.getElementById("registerError").textContent =
      "Username already exists";
    return;
  }

  if (password !== confirmPassword) {
    document.getElementById("registerError").textContent =
      "Passwords do not match";
    return;
  }

  if (profilePicture) {
    const reader = new FileReader();
    reader.onload = function (e) {
      users[username] = {
        password: password,
        profilePicture: e.target.result,
      };
      completeRegistration(username);
    };
    reader.readAsDataURL(profilePicture);
  } else {
    users[username] = {
      password: password,
      profilePicture: "default-profile.png",
    };
    completeRegistration(username);
  }
}

function completeRegistration(username) {
  updateStorage();
  hideModal("registerModal");
  document.getElementById("registerForm").reset();
  showModal("loginModal");
}

// Update UI after auth changes
function updateAuthUI() {
  const authButtons = document.getElementById("authButtons");

  if (currentUser) {
    document.body.classList.add("logged-in");
    const profilePicture =
      users[currentUser].profilePicture || "default-profile.png";
    authButtons.innerHTML = `
      <div class="user-profile">
        <div class="profile-dropdown">
          <img src="${profilePicture}" alt="Profile" class="profile-picture" onclick="toggleDropdown()">
          <div class="dropdown-content" id="profileDropdown">
            <a href="#" onclick="document.getElementById('profilePictureInput').click()">Change Profile Picture</a>
            <a href="#" onclick="deleteAccount()">Delete Account</a>
            <a href="#" onclick="handleLogout()">Logout</a>
          </div>
        </div>
        <span>Welcome, ${currentUser}!</span>
      </div>
      <input type="file" id="profilePictureInput" accept="image/*" style="display: none" onchange="handleProfilePictureUpload(event)">
    `;
  } else {
    document.body.classList.remove("logged-in");
    authButtons.innerHTML = `
      <button onclick="showModal('loginModal')">Login</button>
      <button onclick="showModal('registerModal')">Register</button>
    `;
  }
}
// Handle profile picture upload
function handleProfilePictureUpload(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      users[currentUser].profilePicture = e.target.result;
      updateStorage();
      updateAuthUI();
    };
    reader.readAsDataURL(file);
  }
}

// Toggle dropdown menu
function toggleDropdown() {
  document.getElementById("profileDropdown").classList.toggle("show");
}

// Delete account
function deleteAccount() {
  if (
    confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    )
  ) {
    if (currentUser) {
      posts = posts.filter((post) => post.user !== currentUser);
      delete users[currentUser];
      currentUser = null;
      updateStorage();
      updateAuthUI();
      loadAllPosts();
      alert("Your account has been successfully deleted.");
    }
  }
}

// Handle logout
function handleLogout() {
  currentUser = null;
  updateStorage();
  updateAuthUI();
  loadAllPosts();
}

// Handle review submission
function handleReviewSubmit(event) {
  event.preventDefault();
  if (!currentUser) {
    showModal("loginModal");
    return;
  }

  const category = document.getElementById("category").value;
  const dishName = document.getElementById("dishName").value;
  const rating = document.getElementById("rating").value;
  const reviewText = document.getElementById("reviewText").value;
  const imageFile = document.getElementById("reviewImage").files[0];

  if (imageFile) {
    const reader = new FileReader();
    reader.onload = function (e) {
      createPost(category, dishName, rating, reviewText, e.target.result);
    };
    reader.readAsDataURL(imageFile);
  } else {
    createPost(category, dishName, rating, reviewText, null);
  }

  hideNewPostForm();
  event.target.reset();
}

function createPost(category, dishName, rating, reviewText, image) {
  const post = {
    id: Date.now(),
    user: currentUser,
    category: category,
    dishName: dishName,
    rating: rating,
    text: reviewText,
    date: new Date().toISOString(),
    image: image,
    likes: [],
    comments: [],
  };

  posts.unshift(post);
  updateStorage();
  loadAllPosts();
}

// Load all posts
function loadAllPosts() {
  const container = document.getElementById("reviewsContainer");
  container.innerHTML = "";

  posts.forEach((post) => {
    const postElement = createPostElement(post);
    container.appendChild(postElement);
  });
}

// Create post element
function createPostElement(post) {
  const postElement = document.createElement("div");
  postElement.className = "review-card";
  postElement.dataset.category = post.category;

  const userProfilePic = users[post.user]
    ? users[post.user].profilePicture
    : "default-profile.png";
  const isLiked = post.likes.includes(currentUser);

  postElement.innerHTML = `
        <div class="user-info">
            <img src="${userProfilePic}" alt="${
    post.user
  }" class="profile-picture">
            <span>${post.user}</span>
        </div>
        <h3>${post.dishName}</h3>
        <div class="rating">${"⭐".repeat(post.rating)}</div>
        ${
          post.image
            ? `<img src="${post.image}" class="review-image" alt="${post.dishName}">`
            : ""
        }
        <p>${post.text}</p>
        <div class="date-info">Posted on: ${new Date(
          post.date
        ).toLocaleDateString()}
        // Continuing createPostElement function:
        ${
          currentUser === post.user
            ? `
            <div class="post-actions">
                <button onclick="editPost(${post.id})">Edit</button>
                <button onclick="deletePost(${post.id})">Delete</button>
            </div>
        `
            : ""
        }
        </div>
        <div class="post-actions">
            <button onclick="handleLike(${post.id})" class="like-button ${
    isLiked ? "liked" : ""
  }">
                ${isLiked ? "❤️" : "🤍"} ${post.likes.length}
            </button>
        </div>
        <div class="comments-section">
            <h4>Comments (${post.comments.length})</h4>
            <div class="comments">
                ${post.comments
                  .map(
                    (comment) => `
                    <div class="comment">
                        <strong>${comment.user}</strong>
                        <p>${comment.text}</p>
                        <small>${new Date(
                          comment.date
                        ).toLocaleDateString()}</small>
                    </div>
                `
                  )
                  .join("")}
            </div>
            ${
              currentUser
                ? `
                <div class="add-comment">
                    <textarea id="comment-${post.id}" placeholder="Add a comment..."></textarea>
                    <button onclick="addComment(${post.id})">Comment</button>
                </div>
            `
                : ""
            }
        </div>
    `;

  return postElement;
}

// Handle like
function handleLike(postId) {
  if (!currentUser) {
    showModal("loginModal");
    return;
  }

  const post = posts.find((p) => p.id === postId);
  if (!post) return;

  const likeIndex = post.likes.indexOf(currentUser);
  if (likeIndex === -1) {
    post.likes.push(currentUser);
  } else {
    post.likes.splice(likeIndex, 1);
  }

  updateStorage();
  loadAllPosts();
}

// Add comment
function addComment(postId) {
  if (!currentUser) {
    showModal("loginModal");
    return;
  }

  const commentText = document.getElementById(`comment-${postId}`).value.trim();
  if (!commentText) return;

  const post = posts.find((p) => p.id === postId);
  if (!post) return;

  post.comments.push({
    user: currentUser,
    text: commentText,
    date: new Date().toISOString(),
  });

  updateStorage();
  loadAllPosts();
}

// Edit post
function editPost(postId) {
  const post = posts.find((p) => p.id === postId);
  if (!post || post.user !== currentUser) return;

  showModal("newPostForm");
  document.getElementById("category").value = post.category;
  document.getElementById("dishName").value = post.dishName;
  document.getElementById("rating").value = post.rating;
  document.getElementById("reviewText").value = post.text;

  // Add a data attribute to the form to know we're editing
  document.querySelector("#newPostForm form").dataset.editId = postId;
}

// Delete post
function deletePost(postId) {
  const postIndex = posts.findIndex((p) => p.id === postId);
  if (postIndex === -1 || posts[postIndex].user !== currentUser) return;

  if (confirm("Are you sure you want to delete this post?")) {
    posts.splice(postIndex, 1);
    updateStorage();
    loadAllPosts();
  }
}

// Filter reviews
function filterReviews(category) {
  const buttons = document.querySelectorAll(".category-button");
  buttons.forEach((button) => {
    button.classList.toggle("active", button.dataset.category === category);
  });

  const reviews = document.getElementsByClassName("review-card");
  Array.from(reviews).forEach((review) => {
    if (category === "all" || review.dataset.category === category) {
      review.style.display = "block";
    } else {
      review.style.display = "none";
    }
  });
}

// Close dropdown when clicking outside
window.onclick = function (event) {
  if (!event.target.matches(".profile-picture")) {
    const dropdowns = document.getElementsByClassName("dropdown-content");
    for (let dropdown of dropdowns) {
      if (dropdown.classList.contains("show")) {
        dropdown.classList.remove("show");
      }
    }
  }
};

// Initialize
window.onload = function () {
  updateAuthUI();
  loadAllPosts();
};
