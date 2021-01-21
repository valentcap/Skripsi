
public class Main {

	public static void main(String[] args) {
		// TODO Auto-generated method stub
		Player p1 = new Player("Arnan");
		Player bot = new Player(120,30);
		p1.heal();
		bot.attackEnemy(p1);
		p1.attackEnemy(bot);
		p1.info();
		bot.info();
		System.out.println();
		bot.attackEnemy(p1);
		p1.sacrificeHeal();
		p1.info();
		System.out.println();
		p1.heal();
		bot.attackEnemy(p1);
		bot.attackEnemy(p1);
		bot.attackEnemy(p1);
		p1.info();
	}

}
