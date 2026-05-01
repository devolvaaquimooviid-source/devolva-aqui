const bcrypt = require('bcrypt');

const senha = 'MinhaSenhaForte@2026'; // 👈 TROCA AQUI

bcrypt.hash(senha, 10).then(hash => {
  console.log("HASH:", hash);
});