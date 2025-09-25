package sportlink.sportlink.project.entidades;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "ENTRENADORES")
@ToString
@Builder
@Entity
public class Entrenador implements Serializable {

    @Id
    @Column(name = "ENT_ID", nullable = false)
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "SEQ_ENTRENADOR")
    @SequenceGenerator(name = "SEQ_ENTRENADOR", sequenceName = "SEQ_ENTRENADOR", allocationSize = 1)
    private Integer idEntrenador;

    @Column(name = "ENT_NOMBRE", nullable = false)
    private String nombre;

    @Column(name = "ENT_CORREO", nullable = false)
    private String correo;

    @Column(name = "ENT_CONTRASENIA", nullable = false)
    private String contrasenia;

    @Column(name = "ENT_ESPECIALIDAD", nullable = false)
    private ArrayList<String> especialidad;

    @ElementCollection
    @CollectionTable(
            name = "ENT_CERTIFICACIONES",
            joinColumns = @JoinColumn(name = "ENT_ID")
    )
    @Column(name = "ENT_CERTIFICADO", columnDefinition = "bytea")
    @Lob
    private List<byte[]> certificaciones;

    @Lob
    @Column(name = "ENT_FOTOPERFIL", nullable = true, columnDefinition = "bytea")
    private byte[]  fotoPerfil;

    @OneToMany(cascade = {CascadeType.PERSIST}, mappedBy = "entrenador")
    @JsonIgnoreProperties({"entrenador", "cliente"})
    private List<Resenia> resenias;

    @OneToMany(cascade = {CascadeType.PERSIST}, mappedBy = "entrenador")
    @JsonIgnoreProperties({"entrenador", "cliente"})
    private List<Sesion> sesiones;

    @OneToMany(cascade = {CascadeType.PERSIST}, mappedBy = "entrenador")
    @JsonIgnoreProperties({"entrenador"})
    private List<Servicio> servicios;
}
