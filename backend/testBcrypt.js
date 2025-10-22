// testBcrypt.js


// import bcrypt from "bcryptjs";

// const password = "user12345";

// bcrypt.hash(password, 10, (err, hash) => {
//     if (err) throw err;
//     console.log("Hash for user12345:", hash);
// });



import bcrypt from "bcryptjs";

const hash = "$2b$10$rAL5Kbo8Lt54kr/LMyFY.OwJC01OSfdd0XC4NI2ARInBoqCH1GxJO"; // copy from your DB
const plainPassword = "keside123";

const run = async () => {
    const isMatch = await bcrypt.compare(plainPassword, hash);
    console.log("🔑 Password check result:", isMatch);
};

run();
