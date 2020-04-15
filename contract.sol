pragma solidity >=0.4.0 <=0.6.0; 
pragma experimental ABIEncoderV2;

contract ernergy_matches_contract{
    
    struct Match{
        address matcher;
        string prosumer;
        string consumer;
        
    }
    
    Match[] public energy_matches;
    uint public matchCount;
    uint public lastDeploy;
    
    uint private count;
    
    function deployMatches(string[] memory matches) public {
        lastDeploy += count;
        count = matches.length;
        
        for(uint i = 0; i < matches.length; i++){
            addMatch(matches[i]);
        }
        matchCount = energy_matches.length - 1;
    }
    
    function addMatch(string memory obj) private returns(Match memory) {
        bool change = false;
        byte value = byte(":");
        
        //cast string to bytes to iterate over it
        bytes memory ref = bytes(obj);
        
        //define consumer and prosumer with the length of one address
        bytes memory consumer = new bytes((ref.length - 1)/2);
        bytes memory prosumer = new bytes((ref.length - 1)/2);
        
        //find ':' and write prosumer then consumer
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
        energy_matches.push(Match(msg.sender, string(prosumer), string(consumer)));
    }
    
    
    
    
    
    
    
    
    
    
    
    
    
    
}
