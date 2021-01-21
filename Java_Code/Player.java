
public abstract class Player {
	private String nama;
	private int hp;
	private int atk;
	
	public Player(String nama, int att) {
		this.nama = nama;
		this.atk = att;
		if(nama=="Hitter") {
			this.hp = 100;
		}else if(nama=="Magician") {
			this.hp = 80;
		}else if(nama=="Tanker") {
			this.hp = 200;
		}
	}

	public String getNama() {
		return nama;
	}

	public void setNama(String nama) {
		this.nama = nama;
	}

	public int getHp() {
		return hp;
	}

	public void setHp(int hp) {
		this.hp = hp;
	}

	public int getAtk() {
		return atk;
	}

	public void setAtk(int atk) {
		this.atk = atk;
	}
	
	public void status() {
		System.out.println("Class	: "+this.nama);
		System.out.println("HP	: "+this.hp);
		System.out.println("Attack	: "+this.atk);
		System.out.println();
	}
	
	public void attack(Player player) {
		System.out.println(this.nama+" Attack "+player.nama);
		player.getHit(this.getAtk());
	}
	
	public void getHit(int enemyDamage) {
		this.hp -= enemyDamage;
		if(this.hp<=0) {
			this.hp=0;
			System.out.println(this.nama+" is dead!");
		}
	}
}
