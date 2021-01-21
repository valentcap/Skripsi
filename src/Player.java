
public class Player {
	private String nama;
	private int hp;
	private int maxHp;
	private int att;
	public String getNama() {
		return nama;
	}
	public int getHp() {
		return hp;
	}

	public int getAtt() {
		return att;
	}
	
	public Player(String nama) {
		this.nama=nama;
		this.hp=100;
		this.maxHp=this.hp;
		this.att=20;
	}
	
	public Player(int hp, int att) {
		this.nama="BOT";
		this.hp=hp;
		this.maxHp=this.hp;
		this.att=att;
	}
	
	public void attackEnemy(Player enemy) {
		if(enemy.hp-this.att>0) {
			enemy.hp=enemy.hp-this.att;
		}else {
			enemy.hp=0;
			System.out.println(enemy.nama+" is dead");
		}
		
	}
	public void heal() {
		if(this.hp+15>this.maxHp) {
			int selisih = maxHp%this.hp+15;
			this.hp=this.hp+15-selisih;
			System.out.println("Your HP is full!");
		}else {
			this.hp+=15;
		}
	}
	private void heal(int darah) {
		this.hp=darah;
		this.maxHp=this.hp;
	}
	public void sacrificeHeal() {
		heal(maxHp-25);
	}
	public void info() {
		System.out.println("Nama  : "+this.nama);
		System.out.println("HP    : "+this.hp);
		System.out.println("Attack: "+this.att);
	}
}
