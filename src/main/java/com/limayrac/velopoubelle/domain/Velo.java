package com.limayrac.velopoubelle.domain;

import jakarta.persistence.*;
import java.util.HashMap;
import java.util.Map;

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

    @Column(name = "Position")
    private String position;

    // Getter et Setter pour position
    public String getPosition() {
        return position;
    }

    public void setPosition(String position) {
        this.position = position;
    }

    // Getter et Setter pour idVelo
    public Long getIdVelo() {
        return idVelo;
    }

    public void setIdVelo(Long idVelo) {
        this.idVelo = idVelo;
    }

    // Getter et Setter pour autonomie
    public Integer getAutonomie() {
        return autonomie;
    }

    public void setAutonomie(Integer autonomie) {
        this.autonomie = autonomie;
    }

    // Getter et Setter pour capacite
    public Integer getCapacite() {
        return capacite;
    }

    public void setCapacite(Integer capacite) {
        this.capacite = capacite;
    }

    // Getter et Setter pour etat
    public String getEtat() {
        return etat;
    }

    public void setEtat(String etat) {
        this.etat = etat;
    }

    // Méthode pour transformer position en objet lat/lng
    @Transient
    public Map<String, Double> getPositionObject() {
        if (position != null) {
            String[] parts = position.replace("(", "").replace(")", "").split(" ");
            if (parts.length == 2) {
                try {
                    double lat = Double.parseDouble(parts[0]);
                    double lng = Double.parseDouble(parts[1]);
                    Map<String, Double> pos = new HashMap<>();
                    pos.put("lat", lat);
                    pos.put("lng", lng);
                    return pos;
                } catch (NumberFormatException e) {
                    // Gérer les erreurs de conversion
                }
            }
        }
        return null;
    }
}
