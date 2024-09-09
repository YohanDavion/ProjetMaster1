package com.limayrac.velopoubelle.domain;

import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Entity
public class Rue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String nom;

    private Integer longueur;

    @ManyToMany
    @JoinTable(name = "rue_arret", joinColumns = @JoinColumn(name = "rue_id"), inverseJoinColumns = @JoinColumn(name = "arret_id"))
    private Set<Arret> arrets = new HashSet<>();

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public Integer getLongueur() {
        return longueur;
    }

    public void setLongueur(Integer longueur) {
        this.longueur = longueur;
    }

    public Set<Arret> getArrets() {
        return arrets;
    }

    public void setArrets(Set<Arret> arrets) {
        this.arrets = arrets;
    }
}
