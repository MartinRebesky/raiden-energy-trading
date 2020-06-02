pragma solidity >=0.4.0 <=0.6.8; 
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
    
    //get a specific match
    function getMatch(uint index, uint i) public view returns(Match memory){
        return energy_matches[index].matches[i];
    } 
    
    //push matches into energy_matches
    function deployMatches(Match[] memory m) public {
        matchCount++;
        energy_matches.push();
        energy_matches[energy_matches.length - 1].sender = msg.sender;
        
        for(uint i = 0; i < m.length; i++){
            energy_matches[energy_matches.length - 1].matches.push(m[i]);
        }
    }
}
