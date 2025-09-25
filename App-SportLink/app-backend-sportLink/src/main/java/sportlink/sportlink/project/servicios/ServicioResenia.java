package sportlink.sportlink.project.servicios;

import sportlink.sportlink.project.dto.ReseniaDto;
import sportlink.sportlink.project.entidades.Resenia;
import sportlink.sportlink.project.repositorios.RepositorioResenia;
import org.modelmapper.ModelMapper;
import org.modelmapper.TypeToken;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ServicioResenia {
    private final ModelMapper modelMapper = new ModelMapper();
    private final RepositorioResenia repositorioResenia;

    public ServicioResenia(RepositorioResenia repositorioResenia){
        this.repositorioResenia = repositorioResenia;
    }

    public List<ReseniaDto> obtenerTodos(){
        TypeToken<List<ReseniaDto>> typeToken = new TypeToken<>(){};
        return modelMapper.map(repositorioResenia.obtenerTodos(), typeToken.getType());
    }

    public Optional<ReseniaDto> obtenerPorPk(int pkResenia){
        return Optional.ofNullable(modelMapper.map(
                repositorioResenia.obtenerPorPk(pkResenia).orElse(null),
                ReseniaDto.class
        ));
    }

    public ReseniaDto crear(ReseniaDto reseniaDto){
        if(reseniaDto.getIdResenia() == null){
            Resenia resenia = repositorioResenia.crear(modelMapper.map(reseniaDto, Resenia.class));
            return modelMapper.map(resenia, ReseniaDto.class);
        }else{
            Optional<ReseniaDto> temporal = obtenerPorPk(reseniaDto.getIdResenia());
            if(temporal.isPresent()){
                return reseniaDto;
            }else{
                Resenia resenia = repositorioResenia.crear(modelMapper.map(reseniaDto, Resenia.class));
                return modelMapper.map(resenia, ReseniaDto.class);
            }
        }
    }

    public ReseniaDto actualizar(ReseniaDto reseniaDto){
        if(reseniaDto.getIdResenia() != null){
            Optional<ReseniaDto> nuevaResenia = obtenerPorPk(reseniaDto.getIdResenia());

            if(nuevaResenia.isPresent()){
                if (reseniaDto.getCalificacion() != null) nuevaResenia.get().setCalificacion(reseniaDto.getCalificacion());
                if (reseniaDto.getComentario() != null) nuevaResenia.get().setComentario(reseniaDto.getComentario());

                Resenia resenia = repositorioResenia.actualizar(modelMapper.map(nuevaResenia.get(), Resenia.class));
                return modelMapper.map(resenia, ReseniaDto.class);
            }
        }
        return reseniaDto;
    }

    public boolean eliminarTodos(){
        try {
            repositorioResenia.eliminarTodos();
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean eliminar(int pkResenia){
        return obtenerPorPk(pkResenia).map(reseniaDto -> {
            repositorioResenia.eliminar(modelMapper.map(reseniaDto, Resenia.class));
            return true;
        }).orElse(false);
    }
}
