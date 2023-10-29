import { formatEther, isAddress, isAddressEqual } from "viem";
export const commitValidation= (radio:number,value:bigint,stake:string|null,target:string|null,address:string|null)=>{

    if (!radio) {
        alert("Please select a move");
        return false;
      }
      if (!stake || stake === "0") {
        alert("Please Enter a stake amount");
        return;
      }
      if (parseFloat(formatEther(value)) < parseFloat(stake)) {
        alert("Your stake amount is higher than your balance");
        return;
      }
      if (!target) {
        alert("Please enter a target player to invite");
        return;
      }
      if (!isAddress(target)) {
        alert("Target is not a valid ethereum address");
        return;
      }
      if (isAddressEqual(target as `0x${string}`, address as `0x${string}`)) {
        alert("Target and creator are same");
        return;
      }
  
}