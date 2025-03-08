/**
 * Represents the genetic information of an organism
 * Controls how organisms respond to food and decide on anchoring
 */
export class Gene {
  constructor(sensorDistance = 100, moveThreshold = 0.5, anchorThreshold = 0.2, anchorRatio = 0.3) {
    this.sensorDistance = sensorDistance;
    this.moveThreshold = moveThreshold;
    this.anchorThreshold = anchorThreshold;
    this.anchorRatio = anchorRatio; // Portion of joints that should be anchored
  }
  
  /**
   * Create a mutated copy of the gene
   * @param {number} rate - Mutation rate
   * @returns {Gene} - A new gene with mutations
   */
  mutate(rate) {
    const newGene = new Gene(
      this.sensorDistance + (Math.random() * 2 - 1) * rate * 50,
      this.moveThreshold + (Math.random() * 2 - 1) * rate * 0.3,
      this.anchorThreshold + (Math.random() * 2 - 1) * rate * 0.3,
      this.anchorRatio + (Math.random() * 2 - 1) * rate * 0.2
    );
    
    // Clamp values to reasonable ranges
    newGene.sensorDistance = Math.max(10, Math.min(200, newGene.sensorDistance));
    newGene.moveThreshold = Math.max(0.1, Math.min(0.9, newGene.moveThreshold));
    newGene.anchorThreshold = Math.max(0.1, Math.min(0.9, newGene.anchorThreshold));
    newGene.anchorRatio = Math.max(0.1, Math.min(0.7, newGene.anchorRatio));
    
    return newGene;
  }
}

export default Gene;
