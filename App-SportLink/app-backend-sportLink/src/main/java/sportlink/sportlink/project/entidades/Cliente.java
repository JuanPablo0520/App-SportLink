package sportlink.sportlink.project.entidades;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;
import jakarta.persistence.*;

import java.io.Serializable;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "CLIENTES")
@ToString
@Entity
@Builder
public class Cliente implements Serializable {

    @Id
    @Column(name = "CLI_ID", nullable = false)
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "SEQ_CLIENTE")
    @SequenceGenerator(name = "SEQ_CLIENTE", sequenceName = "SEQ_CLIENTE", allocationSize = 0)
    private Integer idCliente;

    @Column(name = "CLI_NOMBRE", nullable = false)
    private String nombre;

    @Column(name = "CLI_CORREO", nullable = false)
    private String correo;

    @Column(name = "CLI_CONTRASENIA", nullable = false)
    private String contrasenia;

    @Lob
    @Column(name = "CLI_FOTOPERFIL", nullable = true)
    private byte[]  fotoPerfil;

    @Column(name = "CLI_FECHANACIMIENTO", nullable = true)
    private Integer fechaNacimiento;

    @Column(name = "CLI_ESTATURA", nullable = true)
    private Float estatura;

    @Column(name = "CLI_PESO", nullable = true)
    private Float peso;

    @Column(name = "CLI_TELEFONO", nullable = false)
    private String telefono;

    @Column(name = "CLI_UBICACION", nullable = false)
    private String ubicacion;

    @OneToMany(cascade = {CascadeType.PERSIST}, mappedBy = "cliente")
    @JsonIgnoreProperties({"cliente", "entrenador"})
    private List<Sesion> sesiones;

    @OneToMany(cascade = {CascadeType.PERSIST}, mappedBy = "cliente")
    @JsonIgnoreProperties({"cliente", "entrenador"})
    private List<Resenia> resenias;
}
