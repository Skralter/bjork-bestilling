const bcrypt = require("bcrypt");
const { UserStatus } = require("@prisma/client");
const { prisma } = require("../config/prisma");

async function createUser({ fullName, username, password }) {
  return prisma.user.create({
    data: {
      fullName,
      username,
      passwordHash: await bcrypt.hash(password, 12),
      status: UserStatus.PENDING
    }
  });
}

async function authenticateUser({ username, password }) {
  const user = await prisma.user.findUnique({
    where: { username }
  });

  if (!user) {
    return { user: null, message: "Feil brukernavn eller passord." };
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return { user: null, message: "Feil brukernavn eller passord." };
  }

  if (user.status === UserStatus.PENDING) {
    return { user: null, message: "Kontoen din venter fortsatt på godkjenning." };
  }

  if (user.status === UserStatus.REJECTED) {
    return { user: null, message: "Kontoen din er avslått. Kontakt administrator dersom dette er feil." };
  }

  if (user.status === UserStatus.DISABLED) {
    return { user: null, message: "Kontoen din er deaktivert. Kontakt administrator for hjelp." };
  }

  return { user, message: null };
}

module.exports = {
  createUser,
  authenticateUser
};
