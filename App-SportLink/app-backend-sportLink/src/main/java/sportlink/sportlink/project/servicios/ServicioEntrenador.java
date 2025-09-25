package sportlink.sportlink.project.servicios;

import sportlink.sportlink.project.dto.EntrenadorDto;
import sportlink.sportlink.project.entidades.Entrenador;
import sportlink.sportlink.project.repositorios.RepositorioEntrenador;
import org.modelmapper.ModelMapper;
import org.modelmapper.TypeToken;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ServicioEntrenador {
    private final ModelMapper modelMapper = new ModelMapper();
    private final RepositorioEntrenador repositorioEntrenador;

    public ServicioEntrenador(RepositorioEntrenador repositorioEntrenador){
        this.repositorioEntrenador = repositorioEntrenador;
    }

    public List<EntrenadorDto> obtenerTodos(){
        TypeToken<List<EntrenadorDto>> typeToken = new TypeToken<>(){};
        return modelMapper.map(repositorioEntrenador.obtenerTodos(), typeToken.getType());
    }

    public Optional<EntrenadorDto> obtenerPorPk(int pkEntrenador){
        return Optional.ofNullable(modelMapper.map(
                repositorioEntrenador.obtenerPorPk(pkEntrenador).orElse(null),
                EntrenadorDto.class
        ));
    }

    public EntrenadorDto crear(EntrenadorDto entrenadorDto){
        if(entrenadorDto.getIdEntrenador() == null){
            Entrenador entrenador = repositorioEntrenador.crear(modelMapper.map(entrenadorDto, Entrenador.class));
            return modelMapper.map(entrenador, EntrenadorDto.class);
        }else{
            Optional<EntrenadorDto> temporal = obtenerPorPk(entrenadorDto.getIdEntrenador());
            if(temporal.isPresent()){
                return entrenadorDto;
            }else{
                Entrenador entrenador = repositorioEntrenador.crear(modelMapper.map(entrenadorDto, Entrenador.class));
                return modelMapper.map(entrenador, EntrenadorDto.class);
            }
        }
    }

    public EntrenadorDto actualizar(EntrenadorDto entrenadorDto){
        if(entrenadorDto.getIdEntrenador() != null){
            Optional<EntrenadorDto> nuevoEntrenador = obtenerPorPk(entrenadorDto.getIdEntrenador());

            if(nuevoEntrenador.isPresent()){

                if (entrenadorDto.getNombre() != null) nuevoEntrenador.get().setNombre(entrenadorDto.getNombre());
                if (entrenadorDto.getCorreo() != null) nuevoEntrenador.get().setCorreo(entrenadorDto.getCorreo());
                if (entrenadorDto.getContrasenia() != null) nuevoEntrenador.get().setContrasenia(entrenadorDto.getContrasenia());
                if (entrenadorDto.getEspecialidad() != null) nuevoEntrenador.get().setEspecialidad(entrenadorDto.getEspecialidad());
                if (entrenadorDto.getCertificaciones() != null) nuevoEntrenador.get().setCertificaciones(entrenadorDto.getCertificaciones());
                if (entrenadorDto.getFotoPerfil() != null) nuevoEntrenador.get().setFotoPerfil(entrenadorDto.getFotoPerfil());

                Entrenador entrenador = repositorioEntrenador.actualizar(modelMapper.map(nuevoEntrenador.get(), Entrenador.class));
                return modelMapper.map(entrenador, EntrenadorDto.class);
            }
        }
        return entrenadorDto;
    }

    public boolean eliminarTodos(){
        try {
            repositorioEntrenador.eliminarTodos();
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean eliminar(int pkEntrenador){
        return obtenerPorPk(pkEntrenador).map(entrenadorDto -> {
            repositorioEntrenador.eliminar(modelMapper.map(entrenadorDto, Entrenador.class));
            return true;
        }).orElse(false);
    }
}
