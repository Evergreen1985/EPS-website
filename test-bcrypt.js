const bcrypt = require('bcryptjs');

const password = 'Evergreen@2025';  // your login password
const hash = '$2a$10$aKllhxrCrBirKD.ID5W3l.R/ttG7gITRucAnLixvAvjxL8PrYICbe';  // paste the $2a$10$... hash here

bcrypt.compare(password, hash).then(r => {
  console.log('Match:', r);
});