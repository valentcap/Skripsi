
public class Hitter extends Player {

	public Hitter() {
		super("Hitter", 50);
		// TODO Auto-generated constructor stub
	}

	public void attack(Player player) {
		System.out.println(this.getNama()+" Attack "+player.getNama());
		player.getHit(this.getAtk());
		if(player.getHp()<=0) {
			System.out.println("Hitter : Success slay the enemy player !");
		}
	}

}
