
public class Tanker extends Player {

	public Tanker() {
		super("Tanker", 20);
		// TODO Auto-generated constructor stub
	}

	public void getHit(int enemyDamage) {
		System.out.println("Tanker : Success block the enemy player !");
		int hp = this.getHp() - enemyDamage;
		this.setHp(hp);
		if(this.getHp()<=0) {
			this.setHp(0);
			System.out.println(this.getNama()+" is dead!");
		}
	}

}
