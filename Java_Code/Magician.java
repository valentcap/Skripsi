package com.foo.bar.baz;


public class Magician extends Player {

	public Magician() {
		super("Magician", 80);
		// TODO Auto-generated constructor stub
	}

	public void attack(Player player) {
		System.out.println(this.getNama()+" Attack "+player.getNama());
		player.getHit(this.getAtk());
		System.out.println("Magician : Success blast the enemy player !");
	}

}
