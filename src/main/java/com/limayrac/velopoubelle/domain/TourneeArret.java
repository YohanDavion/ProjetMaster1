package com.limayrac.velopoubelle.domain;

import jakarta.persistence.*;
import java.time.LocalTime;

@Entity
public class TourneeArret {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer ordrePassage;
    private LocalTime heureEstimee;

    @ManyToOne
    private Tournee tournee;

    @ManyToOne
    private Arret arret;

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getOrdrePassage() {
        return ordrePassage;
    }

    public void setOrdrePassage(Integer ordrePassage) {
        this.ordrePassage = ordrePassage;
    }

    public LocalTime getHeureEstimee() {
        return heureEstimee;
    }

    public void setHeureEstimee(LocalTime heureEstimee) {
        this.heureEstimee = heureEstimee;
    }

    public Tournee getTournee() {
        return tournee;
    }

    public void setTournee(Tournee tournee) {
        this.tournee = tournee;
    }

    public Arret getArret() {
        return arret;
    }

    public void setArret(Arret arret) {
        this.arret = arret;
    }
}
