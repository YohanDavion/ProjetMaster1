package com.limayrac.velopoubelle.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "arret")
public class Arret {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdArret")
    private Long idArret;

    @Column(name = "Position")
    private String position;

    @Column(name = "Nom")
    private String nom;

    @Column(name = "poubelleVidee")
    private Boolean poubelleVidee;

    public Boolean getPoubelleVidee() {
        return poubelleVidee;
    }

    public void setPoubelleVidee(Boolean poubelleVidee) {
        this.poubelleVidee = poubelleVidee;
    }

    public Long getIdArret() {
        return idArret;
    }

    public void setIdArret(Long idArret) {
        this.idArret = idArret;
    }

    public String getPosition() {
        return position;
    }

    public void setPosition(String position) {
        this.position = position;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }
}
