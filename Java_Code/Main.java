
public class Main {

	public static void main(String[] args) {
		// TODO Auto-generated method stub
		Player h = new Hitter();
		Player m = new Magician();
		Player t = new Tanker();
		
		h.status();
		m.status();
		t.status();
		
		m.attack(h);
		System.out.println();
		h.attack(m);
		h.attack(m);
		System.out.println();
		h.attack(t);
		t.attack(h);
		System.out.println();
		
		h.status();
		m.status();
		t.status();
	}

}
