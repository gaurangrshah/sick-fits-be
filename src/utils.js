// checks current user permissions agains an array of necessary permissions =  [permissisonsNeeded]

function hasPermission(user, permissionsNeeded) {
  // takes in user and an array of neccessary permissions
  const matchedPermissions = user.permissions.filter(permissionTheyHave =>
    // filter users current permissions
    permissionsNeeded.includes(permissionTheyHave)
    // see if users permissions match necessary permissions
  );
  if (!matchedPermissions.length) {
    // if no permissions match tell user they don't have the right permissions:
    throw new Error(`You do not have sufficient permissions

      : ${permissionsNeeded}

      You Have:

      ${user.permissions}
      `);
  }
}

exports.hasPermission = hasPermission;
