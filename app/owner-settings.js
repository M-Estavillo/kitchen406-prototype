/* Account details for the signed-in administrator. */
(() => {
const A=K406,V=A.ownerUI;
A.ownerPages.settings=()=>{
 return V.intro('My Profile','View and manage your personal and account information.')+
  A.account.profileContent(A.session.owner);
};
})();
