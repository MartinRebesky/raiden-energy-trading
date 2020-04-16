pragma solidity >=0.4.0 <=0.6.0; 
pragma experimental ABIEncoderV2;

contract ernergy_matches_contract{
    
    struct Match{
        string prosumer;
        string consumer;
    }
    
    struct Matchlist{
        address sender;
        Match[] matches;
    }
    
    //all matches sent to the smart contract
    Matchlist[] public energy_matches;
    
    //counts how many times matches were deployed
    uint public matchCount;
    
    //get a match from energy_matches
    function getMatch(uint index, uint i) public view returns(Match memory){
        return energy_matches[index].matches[i];
    } 
    
    //add a Matchlist object to energy_matches with the address of the sender and all matches
    function deployMatches(string[] memory matches) public {
        energy_matches.length++;
        energy_matches[energy_matches.length - 1].sender = msg.sender;
        matchCount = energy_matches.length;
        
        for(uint i = 0; i < matches.length; i++){
            addMatch(matches[i]);
        }
    }
    
    //add a match to energy matches 
    function addMatch(string memory obj) private returns(Match memory) {
        bool change = false;
        byte value = byte(":");
        
        //cast string to bytes to iterate over it
        bytes memory ref = bytes(obj);
        
        //define consumer and prosumer with the length of one address
        bytes memory consumer = new bytes((ref.length - 1)/2);
        bytes memory prosumer = new bytes((ref.length - 1)/2);
        
        //iterate over ref and write prosumer then consumer
        //change to consumer when ":" ist found
        for(uint i = 0; i < ref.length; i++){
            if(!change && (byte(ref[i]) != value)){
                prosumer[i] = ref[i];
            }
            else if(change && (byte(ref[i]) != value)){
                consumer[i - prosumer.length - 1] = ref[i];
            }
            else if(byte(ref[i]) == value){
                change = true;
            } 
        }
        //cast prosumer and consumer to a string and push the Match object to the Match[] in the Matchlist object
        energy_matches[energy_matches.length - 1].matches.push(Match(string(prosumer), string(consumer)));
    }
}
