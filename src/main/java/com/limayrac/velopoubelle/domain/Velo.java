package com.limayrac.velopoubelle.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "velo")
public class Velo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idvelo") // Utiliser le nom correct de la colonne
    private Long idVelo;

    @Column(name = "Autonomie")
    private Integer autonomie;

    @Column(name = "Capacite")
    private Integer capacite;

    @Column(name = "Etat")
    private String etat;

    // Getters et Setters
    public Long getIdVelo() {
        return idVelo;
    }

    @Column(name = "Position")
    private String position;

    // Getter et Setter
    public String getPosition() {
        return position;
    }

    public void setPosition(String position) {
        this.position = position;
    }

    public void setIdVelo(Long idVelo) {
        this.idVelo = idVelo;
    }

    public Integer getAutonomie() {
        return autonomie;
    }

    public void setAutonomie(Integer autonomie) {
        this.autonomie = autonomie;
    }

    public Integer getCapacite() {
        return capacite;
    }

    public void setCapacite(Integer capacite) {
        this.capacite = capacite;
    }

    public String getEtat() {
        return etat;
    }

    public void setEtat(String etat) {
        this.etat = etat;
    }
}
