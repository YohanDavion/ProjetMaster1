package com.limayrac.velopoubelle.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "velo")
public class Velo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idvelo")
    private Long idvelo;

    private Integer autonomie;
    private Integer capacite;
    private String etat;

    // Getters and setters
    public Long getIdvelo() {
        return idvelo;
    }

    public void setIdvelo(Long idvelo) {
        this.idvelo = idvelo;
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
